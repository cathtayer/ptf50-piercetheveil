-- backend_checks.sql : automated checks for the admin appointment lifecycle + basic RLS.
-- (Guest booking rules, abuse limits and lookups are in guest_booking_checks.sql.)
-- Uses the existing admin profile (and a customer profile if one exists). No test users to create.
-- Run this whole file in the SQL Editor. It ends with an intentional "error"
-- that carries the PASS/FAIL report, which also rolls back everything it did.

do $$
declare
  adm uuid; cust uuid;
  svc uuid; s1 uuid; s2 uuid;
  a_appt uuid; b_appt uuid;
  n int; st text;
  r text := E'\n';
begin
  select id into adm  from public.profiles where role = 'admin'    limit 1;
  select id into cust from public.profiles where role = 'customer' limit 1;
  if adm is null then
    raise exception 'No admin profile found. Make one first (see README > Admin accounts)';
  end if;

  select id into svc from public.services where name = 'Helix';
  select id into s1 from public.availability_slots
    where starts_at > now() and not is_blocked order by starts_at limit 1;
  select id into s2 from public.availability_slots
    where starts_at > now() and not is_blocked order by starts_at offset 1 limit 1;
  update public.availability_slots set capacity = 1 where id in (s1, s2);   -- undone by the rollback

  ---------------------------------------------------------------- two guests book
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;

  select booking_id into a_appt from public.request_appointment(svc, s1, 'Guest A', '09171110001');
  select booking_id into b_appt from public.request_appointment(svc, s2, 'Guest B', '09171110002');
  r := r || case when a_appt is not null and b_appt is not null then 'PASS  ' else 'FAIL  ' end
         || 'two guests can each request a slot' || E'\n';

  begin
    perform public.request_appointment(svc, s1, 'Guest C', '09171110003');
    r := r || E'FAIL  third guest booked a full slot\n';
  exception when others then
    r := r || case when sqlerrm like '%full%' then 'PASS  ' else 'FAIL  ' end
           || 'full slot is refused (' || sqlerrm || E')\n';
  end;

  begin
    select count(*) into n from public.appointments;
    r := r || case when n = 0 then 'PASS  ' else 'FAIL  ' end
           || 'visitors see no appointments (rows=' || n || E')\n';
  exception when others then
    r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
           || 'visitors cannot read appointments (' || sqlerrm || E')\n';
  end;

  select count(*) into n from public.services;
  r := r || case when n > 0 then 'PASS  ' else 'FAIL  ' end
         || 'visitors can read services (' || n || E')\n';

  ---------------------------------------------------------------- signed-in non-admin (if one exists)
  reset role;
  if cust is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', cust, 'role', 'authenticated')::text, true);
    set local role authenticated;

    begin
      update public.profiles set role = 'admin' where id = cust;
      r := r || E'FAIL  a non-admin promoted themselves to admin\n';
    exception when others then
      r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
             || 'non-admin cannot edit their own role (' || sqlerrm || E')\n';
    end;

    begin
      perform public.admin_update_appointment(a_appt, 'approve');
      r := r || E'FAIL  a non-admin approved an appointment\n';
    exception when others then
      r := r || case when sqlerrm like '%Admins only%' then 'PASS  ' else 'FAIL  ' end
             || 'non-admin cannot approve (' || sqlerrm || E')\n';
    end;
  else
    r := r || E'SKIP  no customer profile exists, so the non-admin checks were skipped\n';
  end if;

  ---------------------------------------------------------------- admin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    perform public.admin_update_appointment(a_appt, 'approve');
    select status::text into st from public.appointments where id = a_appt;
    r := r || case when st = 'APPROVED' then 'PASS  ' else 'FAIL  ' end
           || 'admin approves a pending appointment (' || st || E')\n';
  exception when others then
    r := r || 'FAIL  admin approve: ' || sqlerrm || E'\n';
  end;

  begin
    perform public.admin_update_appointment(a_appt, 'approve');
    r := r || E'FAIL  approving twice was allowed\n';
  exception when others then
    r := r || case when sqlerrm like '%Invalid status change%' then 'PASS  ' else 'FAIL  ' end
           || 'invalid status change is refused (' || sqlerrm || E')\n';
  end;

  begin
    perform public.admin_update_appointment(a_appt, 'reschedule', s2);
    r := r || E'FAIL  rescheduled into a full slot\n';
  exception when others then
    r := r || case when sqlerrm like '%full%' then 'PASS  ' else 'FAIL  ' end
           || 'reschedule into a full slot is refused (' || sqlerrm || E')\n';
  end;

  perform public.admin_update_appointment(b_appt, 'reject');
  select remaining into n from public.get_available_slots(now(), now() + interval '30 days') where id = s2;
  r := r || case when n = 1 then 'PASS  ' else 'FAIL  ' end
         || 'rejecting frees the slot (remaining=' || coalesce(n::text, 'null') || E')\n';

  begin
    perform public.admin_update_appointment(a_appt, 'reschedule', s2);
    r := r || E'PASS  reschedule into a free slot works\n';
  exception when others then
    r := r || 'FAIL  reschedule into a free slot: ' || sqlerrm || E'\n';
  end;

  select remaining into n from public.get_available_slots(now(), now() + interval '30 days') where id = s1;
  r := r || case when n = 1 then 'PASS  ' else 'FAIL  ' end
         || 'old slot is free after reschedule (remaining=' || coalesce(n::text, 'null') || E')\n';

  begin
    perform public.admin_update_appointment(a_appt, 'cancel');
    select status::text into st from public.appointments where id = a_appt;
    r := r || case when st = 'CANCELLED' then 'PASS  ' else 'FAIL  ' end
           || 'admin cancels an approved appointment (' || st || E')\n';
  exception when others then
    r := r || 'FAIL  admin cancel: ' || sqlerrm || E'\n';
  end;

  ---------------------------------------------------------------- audit log
  reset role;
  select count(*) into n from public.appointment_events where appointment_id = a_appt;
  r := r || case when n = 4 then 'PASS  ' else 'FAIL  ' end
         || 'audit trail recorded (' || n || E' events, expected 4: requested, approved, rescheduled, cancelled)\n';

  raise exception E'BACKEND CHECK RESULTS (this error is expected; all test data was rolled back)\n%\nFAIL count: %',
    r, (length(r) - length(replace(r, 'FAIL  ', ''))) / 6;
end;
$$;
