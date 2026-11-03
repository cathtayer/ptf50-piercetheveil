-- backend_checks.sql : automated checks for RLS + appointment functions.
-- BEFORE RUNNING: Supabase > Authentication > Users > Add user (tick "Auto confirm"):
--     test1@example.com, test2@example.com, test3@example.com   (any password)
-- Run this whole file in the SQL Editor. It ends with an intentional "error"
-- that carries the PASS/FAIL report, which also rolls back everything it did.

do $$
declare
  a uuid; b uuid; adm uuid;
  svc uuid; s1 uuid; s2 uuid;
  a_appt uuid; b_appt uuid;
  n int; st text;
  r text := E'\n';
begin
  select id into a   from auth.users where email = 'test1@example.com';
  select id into b   from auth.users where email = 'test2@example.com';
  select id into adm from auth.users where email = 'test3@example.com';
  if a is null or b is null or adm is null then
    raise exception 'Create test1@, test2@, test3@example.com in Authentication > Users first';
  end if;

  update public.profiles set role = 'admin' where id = adm;      -- undone by the rollback
  select id into svc from public.services where name = 'Helix';
  select id into s1 from public.availability_slots
    where starts_at > now() and not is_blocked order by starts_at limit 1;
  select id into s2 from public.availability_slots
    where starts_at > now() and not is_blocked order by starts_at offset 1 limit 1;

  ---------------------------------------------------------------- customer A
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    a_appt := public.request_appointment(svc, s1);
    r := r || E'PASS  customer can request a slot\n';
  exception when others then
    r := r || 'FAIL  customer can request a slot: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.appointments (customer_id, service_id, slot_id) values (a, svc, s2);
    r := r || E'FAIL  customer inserted an appointment directly\n';
  exception when others then
    r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
           || 'direct insert into appointments is blocked (' || sqlerrm || E')\n';
  end;

  begin
    update public.appointments set status = 'APPROVED' where id = a_appt;
    get diagnostics n = row_count;
    select status::text into st from public.appointments where id = a_appt;
    r := r || case when n = 0 and st = 'PENDING' then 'PASS  ' else 'FAIL  ' end
           || 'customer cannot change status directly (rows changed=' || n || ', status=' || st || E')\n';
  exception when others then
    r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
           || 'customer cannot change status directly (' || sqlerrm || E')\n';
  end;

  begin
    update public.profiles set role = 'admin' where id = a;
    r := r || E'FAIL  customer promoted themselves to admin\n';
  exception when others then
    r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
           || 'customer cannot edit their own role (' || sqlerrm || E')\n';
  end;

  begin
    perform public.admin_update_appointment(a_appt, 'approve');
    r := r || E'FAIL  customer approved their own appointment\n';
  exception when others then
    r := r || case when sqlerrm like '%Admins only%' then 'PASS  ' else 'FAIL  ' end
           || 'customer cannot approve (' || sqlerrm || E')\n';
  end;

  select count(*) into n from public.appointments;
  r := r || case when n = 1 then 'PASS  ' else 'FAIL  ' end
         || 'customer A sees only own appointments (' || n || E')\n';

  ---------------------------------------------------------------- customer B
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    perform public.request_appointment(svc, s1);
    r := r || E'FAIL  second customer booked a full slot\n';
  exception when others then
    r := r || case when sqlerrm like '%full%' then 'PASS  ' else 'FAIL  ' end
           || 'full slot is refused (' || sqlerrm || E')\n';
  end;

  select count(*) into n from public.appointments where id = a_appt;
  r := r || case when n = 0 then 'PASS  ' else 'FAIL  ' end
         || 'customer B cannot see customer A''s appointment' || E'\n';

  b_appt := public.request_appointment(svc, s2);

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

  ---------------------------------------------------------------- A cancels
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.cancel_my_appointment(a_appt);
    select status::text into st from public.appointments where id = a_appt;
    r := r || case when st = 'CANCELLED' then 'PASS  ' else 'FAIL  ' end
           || 'customer cancels own appointment (' || st || E')\n';
  exception when others then
    r := r || 'FAIL  customer cancel: ' || sqlerrm || E'\n';
  end;

  ---------------------------------------------------------------- audit log
  reset role;
  select count(*) into n from public.appointment_events where appointment_id = a_appt;
  r := r || case when n = 4 then 'PASS  ' else 'FAIL  ' end
         || 'audit trail recorded (' || n || E' events, expected 4)\n';

  ---------------------------------------------------------------- anonymous visitor
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.services;
  r := r || case when n > 0 then 'PASS  ' else 'FAIL  ' end
         || 'visitors can read services (' || n || E')\n';
  begin
    select count(*) into n from public.appointments;
    r := r || case when n = 0 then 'PASS  ' else 'FAIL  ' end
           || 'visitors see no appointments (rows=' || n || E')\n';
  exception when others then
    r := r || case when sqlstate = '42501' then 'PASS  ' else 'FAIL  ' end
           || 'visitors cannot read appointments (' || sqlerrm || E')\n';
  end;

  reset role;
  raise exception E'BACKEND CHECK RESULTS (this error is expected; all test data was rolled back)\n%', r;
end;
$$;
