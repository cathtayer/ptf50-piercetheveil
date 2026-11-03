-- 0004_seed.sql : starter data (prices from src/data/studioContent.js). Edit freely.
-- Durations are placeholders: adjust to the shop's real timings.

insert into public.piercing_types (name) values
  ('Lobe'), ('Upper lobe'), ('Stacked lobe'), ('Conch'), ('Helix'), ('Vertical helix'),
  ('Flat'), ('Tragus'), ('Rook'), ('Daith'), ('Industrial'), ('Labret'), ('Vertical labret'),
  ('Snake bites'), ('Spider bites'), ('Dolphin bites'), ('Tongue'), ('Septum'), ('Eyebrow'), ('Navel')
on conflict (name) do nothing;

insert into public.services (name, price, duration_minutes, piercing_type_id)
select v.name, v.price, v.mins, p.id
from (values
  ('Lobe', 100, 30), ('Upper lobe', 120, 30), ('Stacked lobe', 170, 30), ('Conch', 200, 30),
  ('Helix', 170, 30), ('Vertical helix', 180, 30), ('Flat', 200, 30), ('Tragus', 250, 30),
  ('Rook', 300, 30), ('Daith', 400, 30), ('Industrial', 450, 45), ('Labret', 350, 30),
  ('Vertical labret', 370, 30), ('Snake bites', 670, 45), ('Spider bites', 670, 45),
  ('Dolphin bites', 670, 45), ('Tongue', 500, 30), ('Septum', 400, 30),
  ('Eyebrow', 350, 30), ('Navel', 450, 30)
) as v(name, price, mins)
join public.piercing_types p on p.name = v.name
where not exists (select 1 from public.services s where s.name = v.name);

-- Sample slots: next 14 days, hourly 10:00-18:00 Asia/Manila, one booking per slot
insert into public.availability_slots (starts_at, ends_at)
select ((d::date + make_time(h, 0, 0)) at time zone 'Asia/Manila'),
       ((d::date + make_time(h + 1, 0, 0)) at time zone 'Asia/Manila')
from generate_series(current_date + 1, current_date + 14, interval '1 day') as d,
     generate_series(10, 17) as h
on conflict (starts_at) do nothing;

-- Sample jewelry for testing the AI recommender (replace with real stock later)
insert into public.jewelry (name, description, material, style, color, price, stock) values
  ('Titanium Flat-Back Stud', 'Minimalist implant-grade titanium flat-back stud, clean and simple', 'Titanium', 'Minimalist', 'Silver', 350, 10),
  ('Gold Hoop Clicker', 'Classic gold-plated hoop clicker, elegant everyday wear', 'Gold', 'Classic', 'Gold', 800, 6),
  ('Opal Cluster Stud', 'Delicate opal cluster stud with a dainty, feminine look', 'Titanium', 'Dainty', 'White', 650, 8),
  ('Black Spike Barbell', 'Edgy black PVD spike barbell with a bold punk look', 'Surgical Steel', 'Edgy', 'Black', 400, 12),
  ('Rose Gold Crystal Ring', 'Rose gold ring with a small crystal, sparkly and romantic', 'Gold', 'Glam', 'Rose Gold', 950, 5),
  ('Minimal Titanium Hoop', 'Slim seamless titanium hoop, subtle and minimalist', 'Titanium', 'Minimalist', 'Silver', 500, 9)
on conflict do nothing;

-- Approve a few placements so filtering can be tested
insert into public.jewelry_compatibility (jewelry_id, piercing_type_id, approved)
select j.id, p.id, true
from public.jewelry j
join public.piercing_types p on
     (j.name = 'Titanium Flat-Back Stud'  and p.name in ('Lobe', 'Helix', 'Tragus', 'Flat'))
  or (j.name = 'Gold Hoop Clicker'        and p.name in ('Lobe', 'Helix', 'Septum', 'Daith'))
  or (j.name = 'Opal Cluster Stud'        and p.name in ('Lobe', 'Upper lobe', 'Helix', 'Conch'))
  or (j.name = 'Black Spike Barbell'      and p.name in ('Industrial', 'Conch', 'Rook', 'Eyebrow'))
  or (j.name = 'Rose Gold Crystal Ring'   and p.name in ('Lobe', 'Helix', 'Septum', 'Navel'))
  or (j.name = 'Minimal Titanium Hoop'    and p.name in ('Helix', 'Septum', 'Daith', 'Lobe'))
on conflict do nothing;
