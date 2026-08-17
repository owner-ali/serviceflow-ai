-- ServiceFlow AI — Phase 1: Services & Bookings
-- =========================================================

create table service_categories (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_service_categories_business on service_categories (business_id);

create table services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  category_id uuid references service_categories (id) on delete set null,
  name text not null,
  description text,
  image_url text,
  starting_price numeric(10,2) not null default 0,
  estimated_duration_minutes int not null default 60,
  required_skills text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_business on services (business_id);
create index idx_services_category on services (category_id);

-- Booking IDs like SF-2026-001284
create sequence booking_number_seq;

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_code text unique not null default
    ('SF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_number_seq')::text, 6, '0')),
  business_id uuid not null references businesses (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  service_id uuid not null references services (id) on delete restrict,
  technician_id uuid references technicians (id) on delete set null,
  status booking_status not null default 'assigned',
  urgency booking_urgency not null default 'normal',
  problem_description text,
  scheduled_date date,
  scheduled_time time,
  address text not null,
  latitude double precision,
  longitude double precision,
  notes text,
  ai_estimated_price_min numeric(10,2),
  ai_estimated_price_max numeric(10,2),
  ai_estimated_duration_minutes int,
  ai_suggested_priority text,
  final_price numeric(10,2),
  signature_url text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_business on bookings (business_id);
create index idx_bookings_customer on bookings (customer_id);
create index idx_bookings_technician on bookings (technician_id);
create index idx_bookings_status on bookings (status);
create index idx_bookings_scheduled_date on bookings (scheduled_date);

create table booking_status_history (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings (id) on delete cascade,
  changed_by uuid references users (id) on delete set null,
  old_status booking_status,
  new_status booking_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_booking_status_history_booking on booking_status_history (booking_id);

-- booking_status_history is append-only; enforce via trigger that auto-inserts on bookings.status change
create or replace function log_booking_status_change() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into booking_status_history (booking_id, changed_by, old_status, new_status)
    values (new.id, auth.uid(), null, new.status);
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into booking_status_history (booking_id, changed_by, old_status, new_status)
    values (new.id, auth.uid(), old.status, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_booking_status_log
  after insert or update on bookings
  for each row execute procedure log_booking_status_change();

-- attachments: booking images/videos, before/after media, profile images, signatures, invoices
create table attachments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  booking_id uuid references bookings (id) on delete cascade,
  uploaded_by uuid references users (id) on delete set null,
  bucket text not null, -- profile-images | service-images | booking-attachments | before-after-media | invoices | signatures
  file_path text not null,
  file_type text,
  category text, -- 'before' | 'after' | 'problem' | 'other'
  created_at timestamptz not null default now()
);

create index idx_attachments_booking on attachments (booking_id);
create index idx_attachments_business on attachments (business_id);
