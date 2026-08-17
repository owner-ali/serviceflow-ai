-- ServiceFlow AI — Phase 1: Customers & Technicians
-- =========================================================

create table customers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid references users (id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  address text,
  latitude double precision,
  longitude double precision,
  notes text,
  total_bookings int not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_booking_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_business on customers (business_id);
create index idx_customers_user on customers (user_id);

create table technicians (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  photo_url text,
  bio text,
  service_area text,
  rating numeric(3,2) not null default 0,
  jobs_completed int not null default 0,
  earnings_total numeric(12,2) not null default 0,
  is_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_technicians_business on technicians (business_id);
create unique index idx_technicians_user on technicians (user_id);

create table technician_skills (
  id uuid primary key default uuid_generate_v4(),
  technician_id uuid not null references technicians (id) on delete cascade,
  skill text not null,
  certified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (technician_id, skill)
);

create table availability (
  id uuid primary key default uuid_generate_v4(),
  technician_id uuid not null references technicians (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index idx_availability_technician on availability (technician_id);

-- Live GPS feed — append-only, latest row per technician read via view below
create table technician_locations (
  id uuid primary key default uuid_generate_v4(),
  technician_id uuid not null references technicians (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  heading numeric(5,2),
  recorded_at timestamptz not null default now()
);

create index idx_tech_locations_technician_time on technician_locations (technician_id, recorded_at desc);

create view technician_current_location as
  select distinct on (technician_id) *
  from technician_locations
  order by technician_id, recorded_at desc;
