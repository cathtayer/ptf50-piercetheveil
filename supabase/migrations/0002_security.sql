-- 0002_security.sql : is_admin(), grants, RLS policies, storage bucket
-- Run second.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function public.is_admin() from public;
grant  execute on function public.is_admin() to anon, authenticated;

-- RLS on every table
alter table public.profiles                enable row level security;
alter table public.piercing_types          enable row level security;
alter table public.services                enable row level security;
alter table public.jewelry                 enable row level security;
alter table public.jewelry_compatibility   enable row level security;
alter table public.jewelry_embeddings      enable row level security;
alter table public.availability_slots      enable row level security;
alter table public.appointments            enable row level security;
alter table public.appointment_events      enable row level security;
alter table public.recommendation_feedback enable row level security;

-- Grants (auto-expose is off, so we grant explicitly; RLS still filters rows)
grant usage on schema public to anon, authenticated;

grant select on public.piercing_types, public.services, public.jewelry,
                public.jewelry_compatibility, public.jewelry_embeddings
  to anon, authenticated;
grant insert, update, delete on public.piercing_types, public.services, public.jewelry,
                public.jewelry_compatibility, public.jewelry_embeddings
  to authenticated;                                   -- admin only, via policies

grant select, insert, update, delete on public.availability_slots to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;   -- role is NOT editable via API

-- appointments are changed ONLY through the RPC functions (0003)
grant select on public.appointments, public.appointment_events to authenticated;

grant select, insert on public.recommendation_feedback to authenticated;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- public catalog data
create policy "piercing_types: public read" on public.piercing_types
  for select to anon, authenticated using (true);
create policy "piercing_types: admin write" on public.piercing_types
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "services: public read active" on public.services
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "services: admin write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "jewelry: public read active" on public.jewelry
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "jewelry: admin write" on public.jewelry
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "jewelry_compat: public read" on public.jewelry_compatibility
  for select to anon, authenticated using (true);
create policy "jewelry_compat: admin write" on public.jewelry_compatibility
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "embeddings: public read" on public.jewelry_embeddings
  for select to anon, authenticated using (true);
create policy "embeddings: admin write" on public.jewelry_embeddings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- slots
create policy "slots: read open" on public.availability_slots
  for select to authenticated using (not is_blocked or public.is_admin());
create policy "slots: admin write" on public.availability_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- appointments (read-only through the API; writes go through RPCs)
create policy "appointments: read own or admin" on public.appointments
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());

create policy "appt_events: read own or admin" on public.appointment_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.id = appointment_events.appointment_id
        and a.customer_id = (select auth.uid())
    )
  );

-- feedback
create policy "feedback: read own or admin" on public.recommendation_feedback
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());
create policy "feedback: insert own" on public.recommendation_feedback
  for insert to authenticated
  with check (customer_id = (select auth.uid()));

-- storage: public bucket for jewelry photos, only admins can upload/change
insert into storage.buckets (id, name, public)
values ('jewelry-images', 'jewelry-images', true)
on conflict (id) do nothing;

create policy "jewelry-images: admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'jewelry-images' and public.is_admin())
  with check (bucket_id = 'jewelry-images' and public.is_admin());
