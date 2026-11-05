-- 0005_fix_grants.sql
-- Supabase can auto-grant FULL table privileges to anon/authenticated on new tables.
-- That made the column-level grant on profiles meaningless (customers could edit their own role).
-- This resets everything to least privilege, re-grants exactly what 0002 intended,
-- and adds a trigger as a second lock on profiles.role. Safe to run more than once.

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- stop future tables/functions from being auto-exposed
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

-- re-grant (same as 0002)
grant usage on schema public to anon, authenticated;

grant select on public.piercing_types, public.services, public.jewelry,
                public.jewelry_compatibility, public.jewelry_embeddings
  to anon, authenticated;
grant insert, update, delete on public.piercing_types, public.services, public.jewelry,
                public.jewelry_compatibility, public.jewelry_embeddings
  to authenticated;                                   -- admin only, enforced by policies

grant select, insert, update, delete on public.availability_slots to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;   -- role NOT editable

grant select on public.appointments, public.appointment_events to authenticated;
grant select, insert on public.recommendation_feedback to authenticated;

-- trigger function should never be callable through the API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- second lock: nobody using the API can change a role (only the SQL editor can)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'Role can only be changed from the SQL editor' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
