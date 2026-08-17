-- ServiceFlow AI — Phase 1: Notifications, AI, Automation, Support, Audit
-- =========================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid references users (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  channel notification_channel not null default 'in_app',
  status notification_status not null default 'queued',
  title text not null,
  body text,
  data jsonb default '{}',
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id);
create index idx_notifications_business on notifications (business_id);

-- AI requests: never store raw API keys here — keys live server-side only (edge function secrets)
create table ai_requests (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  requested_by uuid references users (id) on delete set null,
  booking_id uuid references bookings (id) on delete set null,
  type ai_request_type not null,
  input jsonb not null default '{}',
  output jsonb,
  is_mock boolean not null default true, -- true until real OpenAI/Anthropic wired up
  created_at timestamptz not null default now()
);

create index idx_ai_requests_business on ai_requests (business_id);

create table ai_insights (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  category text not null, -- revenue | bookings | technician_performance | retention | service_popularity | cancellation
  title text not null,
  summary text not null,
  data jsonb default '{}',
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

create index idx_ai_insights_business on ai_insights (business_id);

create table automations (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  trigger_type automation_trigger_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_automations_business on automations (business_id);

create table automation_nodes (
  id uuid primary key default uuid_generate_v4(),
  automation_id uuid not null references automations (id) on delete cascade,
  node_type text not null, -- trigger | condition | ai | notification | whatsapp | email | update_db | delay | webhook
  config jsonb not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_automation_nodes_automation on automation_nodes (automation_id);

create table automation_logs (
  id uuid primary key default uuid_generate_v4(),
  automation_id uuid not null references automations (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  status text not null default 'success', -- success | failed | skipped
  detail jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_automation_logs_automation on automation_logs (automation_id);

create table support_tickets (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses (id) on delete cascade, -- null = platform-level ticket
  raised_by uuid references users (id) on delete set null,
  subject text not null,
  description text,
  status support_ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_support_tickets_business on support_tickets (business_id);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses (id) on delete cascade,
  actor_id uuid references users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_business on audit_logs (business_id);
create index idx_audit_logs_actor on audit_logs (actor_id);
