-- 0007_guest_booking.sql : customers no longer have accounts.
-- Guests book with a name + phone (email optional) and receive a reference code.
-- Only the admin signs in. Run AFTER 0001-0006, in the Supabase SQL Editor.
--
-- Written against the live database state checked on 2026-11-07 (appointments table empty).
-- Safe to re-run. The guard below blocks the one destructive step (dropping customer_id)
-- if real bookings that still use customer_id exist.

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'appointments' and column_name = 'customer_id')
     and exists (select 1 from public.appointments) then
    raise exception '0007 expects an empty appointments table. Migrate existing rows first.';
  end if;
end $$;

-- ---------------------------------------------------------------- 1. appointments

-- policies that mention customer_id must go before the column can be dropped
drop policy if exists "appointments: read own or admin" on public.appointments;
drop policy if exists "appt_events: read own or admin"  on public.appointment_events;

alter table public.appointments
  add column if not exists reference_code text,
  add column if not exists guest_name     text,
  add column if not exists guest_phone    text,   -- digits only, e.g. 09171234567 (see normalize_phone)
  add column if not exists guest_email    text;

alter table public.appointments
  alter column reference_code set not null,
  alter column guest_name     set not null,
  alter column guest_phone    set not null;

alter table public.appointments drop constraint if exists appointments_reference_code_key;
alter table public.appointments add  constraint appointments_reference_code_key unique (reference_code);

alter table public.appointments drop constraint if exists appointments_guest_name_len;
alter table public.appointments add  constraint appointments_guest_name_len
  check (char_length(btrim(guest_name)) between 2 and 80);

alter table public.appointments drop constraint if exists appointments_guest_phone_format;
alter table public.appointments add  constraint appointments_guest_phone_format
  check (guest_phone ~ '^[0-9]{7,15}$');

alter table public.appointments drop constraint if exists appointments_guest_email_format;
alter table public.appointments add  constraint appointments_guest_email_format
  check (guest_email is null
         or (char_length(guest_email) <= 254 and guest_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));

alter table public.appointments drop constraint if exists appointments_notes_len;
alter table public.appointments add  constraint appointments_notes_len
  check (notes is null or char_length(notes) <= 500);

-- customer_id goes away (its foreign key and the per-customer unique index go with it)
drop index if exists public.appointments_one_active_per_customer_slot;
drop index if exists public.appointments_customer_idx;
alter table public.appointments drop column if exists customer_id;

-- the same phone cannot hold the same slot twice
create unique index if not exists appointments_one_active_per_phone_slot
  on public.appointments (guest_phone, slot_id)
  where status in ('PENDING', 'APPROVED');
create index if not exists appointments_phone_idx   on public.appointments (guest_phone);
create index if not exists appointments_created_idx on public.appointments (created_at);

-- only admins can read appointments through the API (guests never read tables directly)
drop policy if exists "appointments: admin read" on public.appointments;
drop policy if exists "appt_events: admin read"  on public.appointment_events;
create policy "appointments: admin read" on public.appointments
  for select to authenticated using (public.is_admin());
create policy "appt_events: admin read" on public.appointment_events
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- 2. internal helpers

-- "+63 917 123 4567", "0917-123-4567", "9171234567" -> "09171234567". Other numbers: 7-15 digits.
create or replace function public.normalize_phone(p text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  d text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if d ~ '^639[0-9]{9}$' then
    d := '0' || substr(d, 3);
  elsif d ~ '^9[0-9]{9}$' then
    d := '0' || d;
  end if;
  if d !~ '^[0-9]{7,15}$' then
    raise exception 'Invalid phone number';
  end if;
  return d;
end;
$$;

-- 8 characters from a 32-letter alphabet (no I, O, 0, 1): about 1.1e12 combinations.
-- Bytes 0-5, 7, 9 of a v4 UUID are fully random (byte 6 and the top bits of byte 8 are fixed).
create or replace function public.new_reference_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b    bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  idx  int;
  code text := '';
begin
  foreach idx in array array[0, 1, 2, 3, 4, 5, 7, 9] loop
    code := code || substr(alphabet, (get_byte(b, idx) % 32) + 1, 1);
  end loop;
  return code;
end;
$$;

revoke execute on function public.normalize_phone(text)   from public, anon, authenticated;
revoke execute on function public.new_reference_code()     from public, anon, authenticated;

-- ---------------------------------------------------------------- 3. booking functions

drop function if exists public.request_appointment(uuid, uuid, text);
drop function if exists public.cancel_my_appointment(uuid);

-- Guest requests a slot -> PENDING. Returns the new id and the reference code to show the guest.
create or replace function public.request_appointment(
  p_service_id  uuid,
  p_slot_id     uuid,
  p_guest_name  text,
  p_guest_phone text,
  p_guest_email text default null,
  p_notes       text default null)
returns table (booking_id uuid, booking_reference text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name   text := btrim(coalesce(p_guest_name, ''));
  v_phone  text;
  v_email  text := nullif(btrim(coalesce(p_guest_email, '')), '');
  v_notes  text := nullif(btrim(coalesce(p_notes, '')), '');
  v_slot   public.availability_slots%rowtype;
  v_taken  int;
  v_active int;
  v_recent int;
  v_id     uuid;
  v_code   text;
  v_try    int := 0;
begin
  -- 1) validate the guest details
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Please enter your name';
  end if;
  v_phone := public.normalize_phone(p_guest_phone);
  if v_email is not null
     and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Invalid email address';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'Notes are too long';
  end if;

  -- 2) abuse limits (an open form could otherwise fill the whole schedule with PENDING requests)
  select count(*) into v_recent from public.appointments
  where created_at > now() - interval '10 minutes';
  if v_recent >= 20 then
    raise exception 'Too many requests right now';
  end if;

  select count(*) into v_active
  from public.appointments a
  join public.availability_slots s on s.id = a.slot_id
  where a.guest_phone = v_phone
    and a.status in ('PENDING', 'APPROVED')
    and s.starts_at > now();
  if v_active >= 3 then
    raise exception 'Too many active bookings';
  end if;

  -- 3) service and slot (the slot row is locked so concurrent requests are serialized)
  if not exists (select 1 from public.services where id = p_service_id and is_active) then
    raise exception 'Service not available';
  end if;

  select * into v_slot from public.availability_slots where id = p_slot_id for update;
  if not found or v_slot.is_blocked or v_slot.starts_at <= now() then
    raise exception 'Slot not available';
  end if;

  if exists (select 1 from public.appointments
             where guest_phone = v_phone and slot_id = p_slot_id
               and status in ('PENDING', 'APPROVED')) then
    raise exception 'Duplicate request' using errcode = '23505';
  end if;

  select count(*) into v_taken
  from public.appointments
  where slot_id = p_slot_id and status in ('PENDING', 'APPROVED');
  if v_taken >= v_slot.capacity then
    raise exception 'Slot is full';
  end if;

  -- 4) insert (retry only if the random reference code happens to collide)
  loop
    v_code := public.new_reference_code();
    begin
      insert into public.appointments
        (service_id, slot_id, guest_name, guest_phone, guest_email, notes, reference_code)
      values
        (p_service_id, p_slot_id, v_name, v_phone, v_email, v_notes, v_code)
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try >= 5 then
        raise;
      end if;
    end;
  end loop;

  insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
  values (v_id, null, null, 'PENDING', 'Requested online by guest');

  return query select v_id, v_code;
end;
$$;

-- Guest looks up a booking with reference code + phone. Same error for "wrong code" and "wrong phone".
create or replace function public.get_booking(p_reference text, p_phone text)
returns table (
  booking_reference text,
  status            public.appointment_status,
  service_name      text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_at        timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ref   text := upper(regexp_replace(coalesce(p_reference, ''), '[^A-Za-z0-9]', '', 'g'));
  v_phone text;
begin
  begin
    v_phone := public.normalize_phone(p_phone);
  exception when others then
    raise exception 'Booking not found';
  end;

  return query
    select a.reference_code, a.status, sv.name, s.starts_at, s.ends_at, a.created_at
    from public.appointments a
    join public.services sv on sv.id = a.service_id
    join public.availability_slots s on s.id = a.slot_id
    where a.reference_code = v_ref and a.guest_phone = v_phone;

  if not found then
    raise exception 'Booking not found';
  end if;
end;
$$;

-- Guest cancels their own PENDING/APPROVED booking (frees the slot)
create or replace function public.cancel_booking(p_reference text, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref   text := upper(regexp_replace(coalesce(p_reference, ''), '[^A-Za-z0-9]', '', 'g'));
  v_phone text;
  v_appt  public.appointments%rowtype;
begin
  begin
    v_phone := public.normalize_phone(p_phone);
  exception when others then
    raise exception 'Booking not found';
  end;

  select * into v_appt from public.appointments
  where reference_code = v_ref and guest_phone = v_phone
  for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_appt.status not in ('PENDING', 'APPROVED') then
    raise exception 'Appointment can no longer be cancelled';
  end if;

  update public.appointments set status = 'CANCELLED', updated_at = now() where id = v_appt.id;
  insert into public.appointment_events (appointment_id, actor_id, old_status, new_status, note)
  values (v_appt.id, null, v_appt.status, 'CANCELLED', 'Cancelled by guest with reference code');
end;
$$;

-- ---------------------------------------------------------------- 4. who may call what

revoke execute on function public.request_appointment(uuid, uuid, text, text, text, text) from public;
revoke execute on function public.get_booking(text, text)                                   from public;
revoke execute on function public.cancel_booking(text, text)                                from public;

-- anon = visitors; authenticated = the admin when previewing the public site while signed in
grant execute on function public.request_appointment(uuid, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.get_booking(text, text)                                   to anon, authenticated;
grant execute on function public.cancel_booking(text, text)                                to anon, authenticated;
grant execute on function public.get_available_slots(timestamptz, timestamptz)             to anon;
-- (get_available_slots already allowed authenticated; admin_update_appointment stays authenticated-only)

-- trigger function: runs as a trigger only, nobody needs to execute it through the API
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
