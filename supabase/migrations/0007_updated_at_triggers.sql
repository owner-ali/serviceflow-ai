-- ServiceFlow AI — Phase 1: updated_at triggers
-- =========================================================

do $$
declare
  t text;
  tables text[] := array[
    'businesses', 'users', 'subscriptions', 'customers', 'technicians',
    'services', 'bookings', 'invoices', 'payments', 'automations', 'support_tickets'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute procedure moddatetime(updated_at);',
      t
    );
  end loop;
end $$;
