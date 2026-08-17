-- ServiceFlow AI — Phase 1: Chat, Invoices, Payments, Reviews
-- =========================================================

create table chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  booking_id uuid references bookings (id) on delete cascade,
  kind text not null default 'customer_technician', -- customer_technician | customer_business
  created_at timestamptz not null default now()
);

create index idx_chat_rooms_business on chat_rooms (business_id);
create index idx_chat_rooms_booking on chat_rooms (booking_id);

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  chat_room_id uuid not null references chat_rooms (id) on delete cascade,
  sender_id uuid not null references users (id) on delete cascade,
  body text,
  image_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_room_time on chat_messages (chat_room_id, created_at);

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  booking_id uuid not null references bookings (id) on delete cascade,
  invoice_number text unique not null,
  status invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_status payment_status not null default 'pending',
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_business on invoices (business_id);
create index idx_invoices_booking on invoices (booking_id);

create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  kind text not null default 'part', -- 'part' | 'labour'
  name text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create index idx_invoice_items_invoice on invoice_items (invoice_id);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  invoice_id uuid not null references invoices (id) on delete cascade,
  provider text not null default 'stripe', -- stripe | paypal | local
  provider_payment_id text,
  amount numeric(12,2) not null,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_business on payments (business_id);
create index idx_payments_invoice on payments (invoice_id);

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  booking_id uuid not null references bookings (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  technician_id uuid references technicians (id) on delete set null,
  service_rating int check (service_rating between 1 and 5),
  technician_rating int check (technician_rating between 1 and 5),
  overall_rating int check (overall_rating between 1 and 5),
  comment text,
  business_response text,
  created_at timestamptz not null default now()
);

create index idx_reviews_business on reviews (business_id);
create index idx_reviews_technician on reviews (technician_id);
