-- ServiceFlow AI — Phase 1: RLS helper functions
-- These read from the `users` table (never from JWT claims) so role/business
-- changes take effect immediately without re-issuing a token.
-- =========================================================

create or replace function current_user_role() returns user_role
language sql stable security definer as $$
  select role from users where id = auth.uid();
$$;

create or replace function current_user_business_id() returns uuid
language sql stable security definer as $$
  select business_id from users where id = auth.uid();
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer as $$
  select current_user_role() = 'super_admin';
$$;

create or replace function is_business_staff() returns boolean
language sql stable security definer as $$
  select current_user_role() in ('business_admin', 'manager');
$$;

create or replace function current_technician_id() returns uuid
language sql stable security definer as $$
  select id from technicians where user_id = auth.uid();
$$;

create or replace function current_customer_id() returns uuid
language sql stable security definer as $$
  select id from customers where user_id = auth.uid();
$$;
