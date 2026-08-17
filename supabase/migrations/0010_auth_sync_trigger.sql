-- ServiceFlow AI — Phase 1: sync auth.users -> public.users on signup
-- role/business_id/full_name are passed via signUp() options.data (raw_user_meta_data)
-- e.g. supabase.auth.signUp({ email, password, options: { data: { full_name, role, business_id } } })
-- =========================================================

create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.users (id, business_id, role, full_name, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'business_id', '')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_auth_user();
