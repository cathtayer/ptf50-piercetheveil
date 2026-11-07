-- 0003_functions.sql : appointment RPCs (atomic slot handling)
-- Run third. Capacity rule: PENDING and APPROVED both hold a slot.

-- Open slots with remaining capacity (customers cannot read others' bookings, so this is an RPC)
create or replace function public.get_available_slots(p_from timestamptz, p_to timestamptz)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, capacity int, remaining int)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.starts_at, s.ends_at, s.capacity,
         (s.capacity - count(a.id))::int as remaining
  from public.availability_slots s
  left join public.appointments a
         on a.slot_id = s.id and a.status in ('PENDING', 'APPROVED')
  where not s.is_blocked
    and s.starts_at > now()
    and s.starts_at >= p_from
    and s.starts_at <  p_to
  group by s.id
  having s.capacity - count(a.id) > 0
  order by s.starts_at;
$$;

-- Customer requests a slot -> PENDING
create or replace function public.request_appointment(
  p_service_id uuid, p_slot_id uuid, p_notes text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_slot  public.availability_slots%rowtype;
  v_taken int;
  v_id    uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.services where id = p_service_id and is_active) then
    raise exception 'Service not available';
  end if;

  -- lock the slot row so concurrent requests are serialized
  select * into v_slot from public.availability_slots where id = p_slot_id for update;
  if not found or v_slot.is_blocked or v_slot.starts_at <= now() then
    raise exception 'Slot not available';
  end if;

  select count(*) into v_taken
  from public.appointments
  where slot_id = p_slot_id and status in ('PENDING', 'APPROVED');

  if v_taken >= v_slot.capacity then
    raise exception 'Slot is full';
  end if;

  insert into public.appointments (customer_id, service_id, slot_id, notes)
  values (v_uid, p_service_id, p_slot_id, p_notes)
  returning id into v_id;

  insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
  values (v_id, v_uid, null, 'PENDING', 'Requested by customer');

  return v_id;
end;
$$;

-- Customer cancels their own PENDING/APPROVED booking (frees the slot)
create or replace function public.cancel_my_appointment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_appt public.appointments%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_appt from public.appointments
  where id = p_id and customer_id = v_uid for update;
  if not found then
    raise exception 'Appointment not found';
  end if;
  if v_appt.status not in ('PENDING', 'APPROVED') then
    raise exception 'Appointment can no longer be cancelled';
  end if;

  update public.appointments set status = 'CANCELLED', updated_at = now() where id = p_id;
  insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
  values (p_id, v_uid, v_appt.status, 'CANCELLED', 'Cancelled by customer');
end;
$$;

-- Admin: approve | reject | reschedule | complete | cancel | no_show
create or replace function public.admin_update_appointment(
  p_id uuid, p_action text, p_new_slot_id uuid default null, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_appt  public.appointments%rowtype;
  v_slot  public.availability_slots%rowtype;
  v_new   public.appointment_status;
  v_taken int;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  select * into v_appt from public.appointments where id = p_id for update;
  if not found then
    raise exception 'Appointment not found';
  end if;

  -- reschedule: validate the new slot, then move
  if p_action = 'reschedule' then
    if v_appt.status not in ('PENDING', 'APPROVED') then
      raise exception 'Only pending or approved appointments can be rescheduled';
    end if;
    if p_new_slot_id is null then
      raise exception 'New slot is required';
    end if;

    select * into v_slot from public.availability_slots where id = p_new_slot_id for update;
    if not found or v_slot.is_blocked or v_slot.starts_at <= now() then
      raise exception 'New slot not available';
    end if;

    if p_new_slot_id <> v_appt.slot_id then
      select count(*) into v_taken from public.appointments
      where slot_id = p_new_slot_id and status in ('PENDING', 'APPROVED');
      if v_taken >= v_slot.capacity then
        raise exception 'New slot is full';
      end if;
    end if;

    update public.appointments set slot_id = p_new_slot_id, updated_at = now() where id = p_id;
    insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
    values (p_id, v_uid, v_appt.status, v_appt.status,
            coalesce(p_note, 'Rescheduled by admin'));
    return;
  end if;

  v_new := (case p_action
              when 'approve'  then 'APPROVED'
              when 'reject'   then 'REJECTED'
              when 'complete' then 'COMPLETED'
              when 'cancel'   then 'CANCELLED'
              when 'no_show'  then 'NO_SHOW'
            end)::public.appointment_status;
  if v_new is null then
    raise exception 'Unknown action: %', p_action;
  end if;

  if not (
       (v_appt.status = 'PENDING'  and v_new in ('APPROVED', 'REJECTED', 'CANCELLED'))
    or (v_appt.status = 'APPROVED' and v_new in ('COMPLETED', 'CANCELLED', 'NO_SHOW'))
  ) then
    raise exception 'Invalid status change: % -> %', v_appt.status, v_new;
  end if;

  -- approving re-checks that the slot is still bookable
  if v_new = 'APPROVED' then
    select * into v_slot from public.availability_slots where id = v_appt.slot_id for update;
    if v_slot.is_blocked then
      raise exception 'Slot has been blocked; reschedule instead';
    end if;
    select count(*) into v_taken from public.appointments
    where slot_id = v_appt.slot_id and status in ('PENDING', 'APPROVED');
    if v_taken > v_slot.capacity then
      raise exception 'Slot is over capacity';
    end if;
  end if;

  update public.appointments set status = v_new, updated_at = now() where id = p_id;
  insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
  values (p_id, v_uid, v_appt.status, v_new, p_note);
end;
$$;

-- only signed-in users may call these
revoke execute on function public.get_available_slots(timestamptz, timestamptz) from public, anon;
revoke execute on function public.request_appointment(uuid, uuid, text)         from public, anon;
revoke execute on function public.cancel_my_appointment(uuid)                   from public, anon;
revoke execute on function public.admin_update_appointment(uuid, text, uuid, text) from public, anon;
grant  execute on function public.get_available_slots(timestamptz, timestamptz) to authenticated;
grant  execute on function public.request_appointment(uuid, uuid, text)         to authenticated;
grant  execute on function public.cancel_my_appointment(uuid)                   to authenticated;
grant  execute on function public.admin_update_appointment(uuid, text, uuid, text) to authenticated;
