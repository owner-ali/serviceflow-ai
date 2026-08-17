-- ServiceFlow AI — Phase 1: Core tenant tables
-- users / businesses / subscriptions
-- =========================================================

-- businesses = tenants. Every business-owned row carries business_id.
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  brand_color text default '#00c389',
  timezone text default 'UTC',
  currency text default 'USD',
  phone text,
  support_email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- users mirrors auth.users (Supabase Auth) 1:1 via id.
-- One user belongs to at most one business (except super_admin, which has business_id null).
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid references businesses (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_business_required_unless_super_admin
    check (role = 'super_admin' or business_id is not null)
);

create index idx_users_business on users (business_id);
create index idx_users_role on users (role);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  plan subscription_plan not null default 'starter',
  status subscription_status not null default 'trialing',
  technician_limit int not null default 3,
  booking_limit_per_month int not null default 100,
  ai_requests_limit_per_month int not null default 50,
  automation_limit int not null default 2,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  external_subscription_id text, -- e.g. Stripe subscription id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_business on subscriptions (business_id);
