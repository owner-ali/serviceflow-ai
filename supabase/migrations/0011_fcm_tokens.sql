-- ServiceFlow AI — Phase 7: device tokens for push notifications
-- =========================================================

create table fcm_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users (id) on delete cascade,
  token text not null,
  platform text not null default 'android', -- android | ios | web
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

create index idx_fcm_tokens_user on fcm_tokens (user_id);

alter table fcm_tokens enable row level security;

create policy fcm_tokens_self_all on fcm_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
