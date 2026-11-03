-- 0001_schema.sql : enums, tables, indexes, signup trigger
-- Run first in Supabase > SQL Editor.

create type public.user_role as enum ('customer', 'admin');
create type public.appointment_status as enum
  ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

create table public.piercing_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text
);

create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  price            numeric(10,2) not null check (price >= 0),   -- PHP
  duration_minutes int not null default 30 check (duration_minutes > 0),
  piercing_type_id uuid references public.piercing_types (id) on delete set null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.jewelry (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  material    text,
  style       text,
  color       text,
  price       numeric(10,2) not null check (price >= 0),        -- PHP
  stock       int not null default 0 check (stock >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- shop-approved placements for each jewelry item
create table public.jewelry_compatibility (
  jewelry_id       uuid not null references public.jewelry (id) on delete cascade,
  piercing_type_id uuid not null references public.piercing_types (id) on delete cascade,
  approved         boolean not null default true,
  primary key (jewelry_id, piercing_type_id)
);

-- cached AI embeddings, keyed by model version
create table public.jewelry_embeddings (
  jewelry_id   uuid not null references public.jewelry (id) on delete cascade,
  model        text not null,
  source_text  text not null,
  embedding    jsonb not null,
  updated_at   timestamptz not null default now(),
  primary key (jewelry_id, model)
);

create table public.availability_slots (
  id         uuid primary key default gen_random_uuid(),
  starts_at  timestamptz not null unique,
  ends_at    timestamptz not null,
  capacity   int not null default 1 check (capacity > 0),
  is_blocked boolean not null default false,
  check (ends_at > starts_at)
);

create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  service_id  uuid not null references public.services (id),
  slot_id     uuid not null references public.availability_slots (id),
  status      public.appointment_status not null default 'PENDING',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.appointment_events (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  actor_id       uuid references public.profiles (id) on delete set null,
  old_status     public.appointment_status,
  new_status     public.appointment_status not null,
  note           text,
  created_at     timestamptz not null default now()
);

create table public.recommendation_feedback (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  jewelry_id  uuid not null references public.jewelry (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  created_at  timestamptz not null default now()
);

-- indexes
create index appointments_customer_idx    on public.appointments (customer_id);
create index appointments_slot_status_idx on public.appointments (slot_id, status);
create index appointments_status_idx      on public.appointments (status);
create index appt_events_appt_idx         on public.appointment_events (appointment_id);
create index feedback_jewelry_idx         on public.recommendation_feedback (jewelry_id);

-- a customer cannot hold the same slot twice
create unique index appointments_one_active_per_customer_slot
  on public.appointments (customer_id, slot_id)
  where status in ('PENDING', 'APPROVED');

-- create a profile automatically on signup (role is ALWAYS 'customer' here)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
