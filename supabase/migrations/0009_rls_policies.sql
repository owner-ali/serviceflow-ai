-- ServiceFlow AI — Phase 1: Row Level Security policies
-- Rule of thumb:
--   super_admin        -> full access to everything (platform ops)
--   business_admin/mgr -> full access to rows where business_id = their business_id
--   technician          -> read/write only what's assigned/relevant to them
--   customer             -> read/write only their own records
-- =========================================================

-- ---------- businesses ----------
alter table businesses enable row level security;

create policy businesses_super_admin_all on businesses
  for all using (is_super_admin()) with check (is_super_admin());

create policy businesses_staff_read_own on businesses
  for select using (id = current_user_business_id());

create policy businesses_staff_update_own on businesses
  for update using (id = current_user_business_id() and is_business_staff())
  with check (id = current_user_business_id() and is_business_staff());

-- ---------- users ----------
alter table users enable row level security;

create policy users_super_admin_all on users
  for all using (is_super_admin()) with check (is_super_admin());

create policy users_self_read on users
  for select using (id = auth.uid());

create policy users_self_update on users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy users_staff_read_business on users
  for select using (business_id = current_user_business_id() and is_business_staff());

create policy users_staff_manage_business on users
  for all using (business_id = current_user_business_id() and is_business_staff())
  with check (business_id = current_user_business_id() and is_business_staff());

-- ---------- subscriptions (business_admin read-only, super_admin manages) ----------
alter table subscriptions enable row level security;

create policy subscriptions_super_admin_all on subscriptions
  for all using (is_super_admin()) with check (is_super_admin());

create policy subscriptions_staff_read on subscriptions
  for select using (business_id = current_user_business_id() and is_business_staff());

-- ---------- generic tenant-scoped tables ----------
-- Applies the same shape to every remaining business_id-scoped table:
--   super_admin: all
--   business staff (admin/manager): all rows in their business
--   everyone else: read-only within their business, where applicable (tightened per-table below)

do $$
declare
  tbl text;
  -- NOTE: technician_skills, availability, invoice_items, automation_nodes, and
  -- automation_logs are deliberately excluded here — they have no business_id
  -- column of their own (only a parent-row id like technician_id/invoice_id/
  -- automation_id), so they get dedicated join-based policies further down instead.
  tenant_tables text[] := array[
    'customers', 'technicians',
    'service_categories', 'services',
    'attachments', 'chat_rooms',
    'invoices', 'payments', 'reviews',
    'notifications', 'ai_requests', 'ai_insights',
    'automations',
    'support_tickets', 'audit_logs', 'technician_locations'
  ];
begin
  foreach tbl in array tenant_tables loop
    execute format('alter table %I enable row level security;', tbl);

    execute format(
      'create policy %I_super_admin_all on %I for all using (is_super_admin()) with check (is_super_admin());',
      tbl, tbl
    );

    execute format(
      'create policy %I_staff_all on %I for all using (business_id = current_user_business_id() and is_business_staff()) with check (business_id = current_user_business_id() and is_business_staff());',
      tbl, tbl
    );
  end loop;
end $$;

-- technician_skills / availability / invoice_items / automation_nodes reference their
-- parent by id, not business_id directly — scope them via a join-based policy instead.
alter table technician_skills enable row level security;
drop policy if exists technician_skills_staff_all on technician_skills;
create policy technician_skills_staff_all on technician_skills for all
  using (exists (select 1 from technicians t where t.id = technician_id and t.business_id = current_user_business_id() and is_business_staff()))
  with check (exists (select 1 from technicians t where t.id = technician_id and t.business_id = current_user_business_id() and is_business_staff()));

alter table availability enable row level security;
drop policy if exists availability_staff_all on availability;
create policy availability_staff_all on availability for all
  using (exists (select 1 from technicians t where t.id = technician_id and t.business_id = current_user_business_id() and is_business_staff()))
  with check (exists (select 1 from technicians t where t.id = technician_id and t.business_id = current_user_business_id() and is_business_staff()));

alter table invoice_items enable row level security;
drop policy if exists invoice_items_staff_all on invoice_items;
create policy invoice_items_staff_all on invoice_items for all
  using (exists (select 1 from invoices i where i.id = invoice_id and i.business_id = current_user_business_id() and is_business_staff()))
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.business_id = current_user_business_id() and is_business_staff()));

alter table automation_nodes enable row level security;
drop policy if exists automation_nodes_staff_all on automation_nodes;
create policy automation_nodes_staff_all on automation_nodes for all
  using (exists (select 1 from automations a where a.id = automation_id and a.business_id = current_user_business_id() and is_business_staff()))
  with check (exists (select 1 from automations a where a.id = automation_id and a.business_id = current_user_business_id() and is_business_staff()));

alter table automation_logs enable row level security;
drop policy if exists automation_logs_staff_all on automation_logs;
create policy automation_logs_super_admin_all on automation_logs
  for all using (is_super_admin()) with check (is_super_admin());
create policy automation_logs_staff_all on automation_logs for all
  using (exists (select 1 from automations a where a.id = automation_id and a.business_id = current_user_business_id() and is_business_staff()))
  with check (exists (select 1 from automations a where a.id = automation_id and a.business_id = current_user_business_id() and is_business_staff()));

-- ---------- technicians: self access ----------
create policy technicians_self_read on technicians
  for select using (user_id = auth.uid());

create policy technicians_self_update_availability on technicians
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- customers: self access ----------
create policy customers_self_read on customers
  for select using (user_id = auth.uid());

-- ---------- bookings: tenant + role-scoped ----------
alter table bookings enable row level security;

create policy bookings_super_admin_all on bookings
  for all using (is_super_admin()) with check (is_super_admin());

create policy bookings_staff_all on bookings
  for all using (business_id = current_user_business_id() and is_business_staff())
  with check (business_id = current_user_business_id() and is_business_staff());

create policy bookings_technician_read_own on bookings
  for select using (technician_id = current_technician_id());

create policy bookings_technician_update_own on bookings
  for update using (technician_id = current_technician_id())
  with check (technician_id = current_technician_id());

create policy bookings_customer_read_own on bookings
  for select using (customer_id = current_customer_id());

create policy bookings_customer_create_own on bookings
  for insert with check (customer_id = current_customer_id());

-- ---------- booking_status_history: read within own booking scope ----------
alter table booking_status_history enable row level security;

create policy booking_history_super_admin_all on booking_status_history
  for all using (is_super_admin()) with check (is_super_admin());

create policy booking_history_staff_read on booking_status_history
  for select using (exists (
    select 1 from bookings b where b.id = booking_id
    and b.business_id = current_user_business_id() and is_business_staff()
  ));

create policy booking_history_participant_read on booking_status_history
  for select using (exists (
    select 1 from bookings b where b.id = booking_id
    and (b.technician_id = current_technician_id() or b.customer_id = current_customer_id())
  ));

-- ---------- chat_messages: participants of the room only ----------
alter table chat_messages enable row level security;

create policy chat_messages_super_admin_all on chat_messages
  for all using (is_super_admin()) with check (is_super_admin());

create policy chat_messages_business_staff on chat_messages
  for all using (exists (
    select 1 from chat_rooms r where r.id = chat_room_id
    and r.business_id = current_user_business_id() and is_business_staff()
  )) with check (exists (
    select 1 from chat_rooms r where r.id = chat_room_id
    and r.business_id = current_user_business_id() and is_business_staff()
  ));

create policy chat_messages_participants on chat_messages
  for all using (exists (
    select 1 from chat_rooms r join bookings b on b.id = r.booking_id
    where r.id = chat_room_id
    and (b.technician_id = current_technician_id() or b.customer_id = current_customer_id())
  )) with check (sender_id = auth.uid());

-- ---------- reviews: customer can create for own booking, everyone in business can read ----------
create policy reviews_customer_create_own on reviews
  for insert with check (customer_id = current_customer_id());

create policy reviews_customer_read_own on reviews
  for select using (customer_id = current_customer_id());

create policy reviews_technician_read_own on reviews
  for select using (technician_id = current_technician_id());

-- ---------- notifications: user reads their own ----------
create policy notifications_self_read on notifications
  for select using (user_id = auth.uid());

create policy notifications_self_update_read_status on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- technician_locations: technician writes own, staff/customer-of-active-booking read ----------
create policy technician_locations_self_write on technician_locations
  for insert with check (technician_id = current_technician_id());

create policy technician_locations_customer_read_active on technician_locations
  for select using (exists (
    select 1 from bookings b
    where b.technician_id = technician_locations.technician_id
    and b.customer_id = current_customer_id()
    and b.status in ('accepted', 'on_the_way', 'arrived', 'inspection', 'working', 'parts_required')
  ));