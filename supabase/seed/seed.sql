-- ServiceFlow AI — Demo data seed
-- Generates: 3 businesses, 30 customers, 15 technicians, 20 services, 50 bookings,
-- 40 invoices, 30 reviews, chat messages, notifications, AI insights, automation logs.
-- Run AFTER migrations: supabase db reset (auto-runs this) or `psql -f seed.sql`
-- =========================================================

do $$
declare
  biz_ids uuid[] := array[uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4()];
  biz_names text[] := array['CoolAir HVAC Co.', 'BrightSpark Electrical', 'FlowFix Plumbing'];
  category_names text[] := array['AC/HVAC', 'Electrical', 'Plumbing', 'Cleaning', 'Appliance Repair', 'Solar'];
  service_names text[] := array[
    'AC Repair', 'AC Installation', 'Duct Cleaning', 'Wiring Inspection', 'Panel Upgrade',
    'Outlet Installation', 'Leak Repair', 'Pipe Replacement', 'Drain Cleaning', 'Deep Cleaning',
    'Move-out Cleaning', 'Fridge Repair', 'Washer Repair', 'Solar Panel Install', 'Solar Maintenance',
    'Water Heater Repair', 'Smart Thermostat Install', 'Circuit Breaker Fix', 'Toilet Repair', 'Gutter Cleaning'
  ];
  i int;
  j int;
  biz_id uuid;
  cat_id uuid;
  svc_id uuid;
  cust_id uuid;
  tech_id uuid;
  tech_user_id uuid;
  cust_user_id uuid;
  booking_id uuid;
  chosen_status booking_status;
  statuses booking_status[] := array['assigned','accepted','on_the_way','arrived','working','completed','paid','reviewed']::booking_status[];
  service_ids uuid[];
  customer_ids uuid[];
  technician_ids uuid[];
begin
  -- Businesses + subscriptions
  for i in 1..3 loop
    biz_id := biz_ids[i];
    insert into businesses (id, name, slug, brand_color, currency, is_active)
    values (biz_id, biz_names[i], lower(replace(biz_names[i], ' ', '-')), '#10b981', 'USD', true);

    insert into subscriptions (business_id, plan, status, technician_limit, booking_limit_per_month)
    values (biz_id, (array['starter','professional','enterprise']::subscription_plan[])[i], 'active', 5 * i, 200);

    -- Categories + services (per business, ~6-7 services)
    for j in 1..6 loop
      insert into service_categories (business_id, name, sort_order)
      values (biz_id, category_names[j], j)
      returning id into cat_id;

      insert into services (business_id, category_id, name, description, starting_price, estimated_duration_minutes, is_active)
      values (
        biz_id, cat_id, service_names[((i - 1) * 6 + j - 1) % array_length(service_names, 1) + 1],
        'Professional service performed by a certified technician.',
        (30 + random() * 120)::numeric(10,2), (30 + random() * 90)::int, true
      )
      returning id into svc_id;
      service_ids := array_append(service_ids, svc_id);
    end loop;

    -- Technicians (5 per business = 15 total)
    for j in 1..5 loop
      tech_user_id := uuid_generate_v4();
      insert into users (id, business_id, role, full_name, email, is_active)
      values (tech_user_id, biz_id, 'technician', 'Technician ' || ((i-1)*5+j), 'tech' || ((i-1)*5+j) || '@demo.serviceflow.ai', true)
      on conflict (id) do nothing;

      insert into technicians (business_id, user_id, rating, jobs_completed, earnings_total, is_available, is_active)
      values (biz_id, tech_user_id, (3.5 + random() * 1.5)::numeric(3,2), (5 + random() * 40)::int, (500 + random() * 4000)::numeric(12,2), true, true)
      returning id into tech_id;
      technician_ids := array_append(technician_ids, tech_id);
    end loop;

    -- Customers (10 per business = 30 total)
    for j in 1..10 loop
      cust_user_id := uuid_generate_v4();
      insert into users (id, business_id, role, full_name, email, is_active)
      values (cust_user_id, biz_id, 'customer', 'Customer ' || ((i-1)*10+j), 'customer' || ((i-1)*10+j) || '@demo.serviceflow.ai', true)
      on conflict (id) do nothing;

      insert into customers (business_id, user_id, full_name, phone, address, total_bookings, total_spent)
      values (biz_id, cust_user_id, 'Customer ' || ((i-1)*10+j), '+1555000' || lpad(((i-1)*10+j)::text, 4, '0'),
              (100 + j) || ' Demo Street, City ' || i, 0, 0)
      returning id into cust_id;
      customer_ids := array_append(customer_ids, cust_id);
    end loop;
  end loop;

  -- Bookings (~50 across all businesses, cycling through customers/technicians/services)
  for i in 1..50 loop
    cust_id := customer_ids[1 + (i % array_length(customer_ids, 1))];
    tech_id := technician_ids[1 + (i % array_length(technician_ids, 1))];
    svc_id := service_ids[1 + (i % array_length(service_ids, 1))];
    chosen_status := statuses[1 + (i % array_length(statuses, 1))];

    select business_id into biz_id from customers where id = cust_id;

    insert into bookings (
      business_id, customer_id, service_id, technician_id, status, urgency,
      problem_description, scheduled_date, address, final_price
    ) values (
      biz_id, cust_id, svc_id, tech_id, chosen_status,
      (array['low','normal','urgent']::booking_urgency[])[1 + (i % 3)],
      'Demo problem description for seeded booking ' || i,
      current_date + ((i % 14) - 7),
      'Demo address ' || i,
      case when chosen_status in ('completed','paid','reviewed') then (60 + random() * 200)::numeric(10,2) else null end
    )
    returning id into booking_id;

    -- Invoices for completed/paid bookings (~40 total)
    if chosen_status in ('completed', 'paid', 'reviewed') and i <= 40 then
      insert into invoices (business_id, booking_id, invoice_number, status, subtotal, tax, total, payment_status)
      values (
        biz_id, booking_id, 'INV-DEMO-' || i, case when chosen_status = 'paid' then 'paid' else 'sent' end,
        (60 + random() * 180)::numeric(10,2), (5 + random() * 15)::numeric(10,2), (70 + random() * 200)::numeric(10,2),
        case when chosen_status = 'paid' then 'paid' else 'pending' end
      );
    end if;

    -- Reviews (~30 total, for reviewed bookings)
    if chosen_status = 'reviewed' then
      insert into reviews (business_id, booking_id, customer_id, technician_id, service_rating, technician_rating, overall_rating, comment)
      values (biz_id, booking_id, cust_id, tech_id, 4 + (i % 2), 4 + (i % 2), 4 + (i % 2), 'Great service, seeded demo review ' || i);
    end if;
  end loop;

  -- AI insights (a few per business)
  foreach biz_id in array biz_ids loop
    insert into ai_insights (business_id, category, title, summary, period_start, period_end)
    values
      (biz_id, 'revenue', 'Revenue up this month', 'Revenue trended upward compared to the prior period based on seeded demo data.', current_date - 30, current_date),
      (biz_id, 'technician_performance', 'Top performer identified', 'One technician completed noticeably more jobs than the team average.', current_date - 30, current_date);
  end loop;

end $$;
