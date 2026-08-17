// ServiceFlow AI — Demo Mode seed data
// Used only when NEXT_PUBLIC_DEMO_MODE=true. Mirrors supabase/migrations schema
// closely enough for every admin page to render real-looking data with zero
// Supabase project required.

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const todayPlus = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export const DEMO_BUSINESS_ID = 'demo-biz-001';
export const DEMO_USER_ID = 'demo-user-admin';

export const demoUser = {
  id: DEMO_USER_ID,
  email: 'demo@serviceflow.ai',
  user_metadata: { business_id: DEMO_BUSINESS_ID, role: 'business_admin', full_name: 'Demo Admin' },
};

const techUserIds = Array.from({ length: 6 }, (_, i) => `demo-tech-user-${i + 1}`);
const custUserIds = Array.from({ length: 8 }, (_, i) => `demo-cust-user-${i + 1}`);

export const demoData: Record<string, any[]> = {
  businesses: [
    {
      id: DEMO_BUSINESS_ID, name: 'CoolAir HVAC Co.', slug: 'coolair-hvac',
      logo_url: null, brand_color: '#10b981', timezone: 'America/New_York', currency: 'USD',
      phone: '+1 555-0100', support_email: 'support@coolair.demo', address: '400 Demo Ave, Austin, TX',
      is_active: true, created_at: daysAgo(120),
    },
  ],
  subscriptions: [
    {
      id: 'demo-sub-1', business_id: DEMO_BUSINESS_ID, plan: 'professional', status: 'active',
      technician_limit: 15, booking_limit_per_month: 500, ai_requests_limit_per_month: 1000,
      automation_limit: 10, current_period_start: daysAgo(20), current_period_end: todayPlus(10),
    },
  ],
  users: [
    demoUser,
    ...techUserIds.map((id, i) => ({ id, business_id: DEMO_BUSINESS_ID, role: 'technician', full_name: ['Ahmed R.', 'Sara K.', 'Bilal M.', 'Fatima N.', 'Usman T.', 'Hina S.'][i], email: `tech${i + 1}@coolair.demo`, is_active: true })),
    ...custUserIds.map((id, i) => ({ id, business_id: DEMO_BUSINESS_ID, role: 'customer', full_name: `Customer ${i + 1}`, email: `customer${i + 1}@demo.mail`, is_active: true })),
  ],
  service_categories: [
    { id: 'cat-1', business_id: DEMO_BUSINESS_ID, name: 'AC / HVAC', sort_order: 1 },
    { id: 'cat-2', business_id: DEMO_BUSINESS_ID, name: 'Electrical', sort_order: 2 },
    { id: 'cat-3', business_id: DEMO_BUSINESS_ID, name: 'Plumbing', sort_order: 3 },
  ],
  services: [
    { id: 'svc-1', business_id: DEMO_BUSINESS_ID, category_id: 'cat-1', name: 'AC Repair', description: 'Diagnose and repair AC units', starting_price: 80, estimated_duration_minutes: 60, required_skills: ['ac'], is_active: true },
    { id: 'svc-2', business_id: DEMO_BUSINESS_ID, category_id: 'cat-1', name: 'Duct Cleaning', description: 'Full duct system cleaning', starting_price: 120, estimated_duration_minutes: 90, required_skills: ['ac'], is_active: true },
    { id: 'svc-3', business_id: DEMO_BUSINESS_ID, category_id: 'cat-2', name: 'Panel Upgrade', description: 'Electrical panel upgrade', starting_price: 350, estimated_duration_minutes: 180, required_skills: ['electrical'], is_active: true },
    { id: 'svc-4', business_id: DEMO_BUSINESS_ID, category_id: 'cat-3', name: 'Leak Repair', description: 'Pipe leak diagnosis and repair', starting_price: 90, estimated_duration_minutes: 60, required_skills: ['plumbing'], is_active: true },
  ],
  technicians: techUserIds.map((uid, i) => ({
    id: `tech-${i + 1}`, business_id: DEMO_BUSINESS_ID, user_id: uid,
    photo_url: null, bio: 'Certified field technician', service_area: 'North Austin',
    rating: [4.9, 4.7, 4.5, 4.8, 4.3, 4.6][i], jobs_completed: [18, 14, 9, 21, 6, 12][i],
    earnings_total: [3200, 2400, 1500, 3900, 900, 2100][i], is_available: i % 3 !== 2, is_active: true,
  })),
  customers: custUserIds.map((uid, i) => ({
    id: `cust-${i + 1}`, business_id: DEMO_BUSINESS_ID, user_id: uid,
    full_name: `Customer ${i + 1}`, phone: `+1 555-02${10 + i}`, email: `customer${i + 1}@demo.mail`,
    address: `${100 + i} Demo Street, Austin, TX`, total_bookings: [5, 2, 8, 1, 3, 6, 4, 2][i],
    total_spent: [640, 210, 980, 90, 340, 720, 480, 150][i], last_booking_at: daysAgo(i + 1),
  })),
  bookings: [
    { id: 'bk-1', booking_code: 'SF-2026-001284', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-1', service_id: 'svc-1', technician_id: 'tech-1', status: 'working', urgency: 'normal', problem_description: 'AC not cooling, rattling noise', scheduled_date: todayPlus(0), scheduled_time: '14:00:00', address: '101 Demo Street, Austin, TX', notes: null, final_price: null, created_at: daysAgo(0) },
    { id: 'bk-2', booking_code: 'SF-2026-001285', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-2', service_id: 'svc-3', technician_id: 'tech-2', status: 'on_the_way', urgency: 'urgent', problem_description: 'Breaker panel sparking', scheduled_date: todayPlus(0), scheduled_time: '15:30:00', address: '102 Demo Street, Austin, TX', notes: null, final_price: null, created_at: daysAgo(0) },
    { id: 'bk-3', booking_code: 'SF-2026-001286', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-3', service_id: 'svc-4', technician_id: 'tech-3', status: 'completed', urgency: 'normal', problem_description: 'Kitchen sink leak', scheduled_date: todayPlus(-1), scheduled_time: '10:00:00', address: '103 Demo Street, Austin, TX', notes: null, final_price: 145, created_at: daysAgo(1) },
    { id: 'bk-4', booking_code: 'SF-2026-001287', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-4', service_id: 'svc-2', technician_id: null, status: 'assigned', urgency: 'low', problem_description: 'Annual duct cleaning', scheduled_date: todayPlus(2), scheduled_time: '09:00:00', address: '104 Demo Street, Austin, TX', notes: null, final_price: null, created_at: daysAgo(0) },
    { id: 'bk-5', booking_code: 'SF-2026-001288', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-5', service_id: 'svc-1', technician_id: 'tech-4', status: 'paid', urgency: 'normal', problem_description: 'AC installation follow-up', scheduled_date: todayPlus(-3), scheduled_time: '11:00:00', address: '105 Demo Street, Austin, TX', notes: null, final_price: 210, created_at: daysAgo(3) },
    { id: 'bk-6', booking_code: 'SF-2026-001289', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-6', service_id: 'svc-4', technician_id: 'tech-5', status: 'reviewed', urgency: 'normal', problem_description: 'Bathroom leak repair', scheduled_date: todayPlus(-5), scheduled_time: '13:00:00', address: '106 Demo Street, Austin, TX', notes: null, final_price: 95, created_at: daysAgo(5) },
    { id: 'bk-7', booking_code: 'SF-2026-001290', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-7', service_id: 'svc-3', technician_id: 'tech-6', status: 'arrived', urgency: 'urgent', problem_description: 'Power outage in unit', scheduled_date: todayPlus(0), scheduled_time: '16:00:00', address: '107 Demo Street, Austin, TX', notes: null, final_price: null, created_at: daysAgo(0) },
    { id: 'bk-8', booking_code: 'SF-2026-001291', business_id: DEMO_BUSINESS_ID, customer_id: 'cust-8', service_id: 'svc-1', technician_id: null, status: 'cancelled', urgency: 'low', problem_description: 'Customer rescheduled elsewhere', scheduled_date: todayPlus(-2), scheduled_time: '10:00:00', address: '108 Demo Street, Austin, TX', notes: null, final_price: null, created_at: daysAgo(2) },
  ],
  invoices: [
    { id: 'inv-1', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-3', invoice_number: 'INV-DEMO-1001', status: 'paid', subtotal: 130, tax: 15, discount: 0, total: 145, payment_status: 'paid', pdf_url: null, created_at: daysAgo(1) },
    { id: 'inv-2', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-5', invoice_number: 'INV-DEMO-1002', status: 'paid', subtotal: 190, tax: 20, discount: 0, total: 210, payment_status: 'paid', pdf_url: null, created_at: daysAgo(3) },
    { id: 'inv-3', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-6', invoice_number: 'INV-DEMO-1003', status: 'sent', subtotal: 85, tax: 10, discount: 0, total: 95, payment_status: 'pending', pdf_url: null, created_at: daysAgo(5) },
  ],
  invoice_items: [
    { id: 'ii-1', invoice_id: 'inv-1', kind: 'part', name: 'PVC Pipe Fitting', quantity: 2, unit_price: 15, total: 30 },
    { id: 'ii-2', invoice_id: 'inv-1', kind: 'labour', name: 'Leak repair labour', quantity: 1, unit_price: 100, total: 100 },
    { id: 'ii-3', invoice_id: 'inv-2', kind: 'labour', name: 'AC follow-up labour', quantity: 1, unit_price: 190, total: 190 },
    { id: 'ii-4', invoice_id: 'inv-3', kind: 'labour', name: 'Bathroom leak labour', quantity: 1, unit_price: 85, total: 85 },
  ],
  payments: [
    { id: 'pay-1', business_id: DEMO_BUSINESS_ID, invoice_id: 'inv-1', provider: 'stripe', provider_payment_id: 'pi_demo_1', amount: 145, status: 'paid', paid_at: daysAgo(1), created_at: daysAgo(1) },
    { id: 'pay-2', business_id: DEMO_BUSINESS_ID, invoice_id: 'inv-2', provider: 'stripe', provider_payment_id: 'pi_demo_2', amount: 210, status: 'paid', paid_at: daysAgo(3), created_at: daysAgo(3) },
  ],
  reviews: [
    { id: 'rev-1', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-6', customer_id: 'cust-6', technician_id: 'tech-5', service_rating: 5, technician_rating: 5, overall_rating: 5, comment: 'Fast and professional, fixed it in 30 minutes!', business_response: null, created_at: daysAgo(5) },
    { id: 'rev-2', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-3', customer_id: 'cust-3', technician_id: 'tech-3', service_rating: 4, technician_rating: 5, overall_rating: 4, comment: 'Good work, a bit late to arrive.', business_response: 'Thanks for the feedback — we are working on our scheduling buffers.', created_at: daysAgo(1) },
  ],
  notifications: [
    { id: 'notif-1', business_id: DEMO_BUSINESS_ID, user_id: DEMO_USER_ID, booking_id: 'bk-1', channel: 'in_app', status: 'sent', title: 'New booking received', body: 'SF-2026-001284 — AC Repair', data: {}, created_at: daysAgo(0) },
    { id: 'notif-2', business_id: DEMO_BUSINESS_ID, user_id: DEMO_USER_ID, booking_id: 'bk-2', channel: 'whatsapp', status: 'delivered', title: 'Technician assigned', body: 'Sara K. assigned to SF-2026-001285', data: {}, created_at: daysAgo(0) },
    { id: 'notif-3', business_id: DEMO_BUSINESS_ID, user_id: DEMO_USER_ID, booking_id: 'bk-3', channel: 'email', status: 'sent', title: 'Invoice paid', body: 'INV-DEMO-1001 marked as paid', data: {}, created_at: daysAgo(1) },
  ],
  ai_insights: [
    { id: 'ai-1', business_id: DEMO_BUSINESS_ID, category: 'revenue', title: 'Revenue up this month', summary: 'Revenue trended 12% upward compared to the prior 30-day period, led by AC repair bookings.', period_start: daysAgo(30), period_end: now() },
    { id: 'ai-2', business_id: DEMO_BUSINESS_ID, category: 'technician_performance', title: 'Ahmed R. is your top performer', summary: 'Ahmed completed 18 jobs this month with a 4.9★ average — 22% above the team average.', period_start: daysAgo(30), period_end: now() },
    { id: 'ai-3', business_id: DEMO_BUSINESS_ID, category: 'cancellation', title: 'Cancellations concentrated on low-urgency bookings', summary: 'Most cancellations came from low-urgency, non-emergency requests scheduled more than 3 days out.', period_start: daysAgo(30), period_end: now() },
  ],
  automations: [
    { id: 'auto-1', business_id: DEMO_BUSINESS_ID, name: 'Booking confirmation + reminder', trigger_type: 'booking_created', is_active: true },
    { id: 'auto-2', business_id: DEMO_BUSINESS_ID, name: 'Review request after completion', trigger_type: 'job_completed', is_active: true },
  ],
  automation_nodes: [
    { id: 'node-1', automation_id: 'auto-1', node_type: 'trigger', position: 0, config: {} },
    { id: 'node-2', automation_id: 'auto-1', node_type: 'whatsapp', position: 1, config: {} },
    { id: 'node-3', automation_id: 'auto-1', node_type: 'delay', position: 2, config: {} },
    { id: 'node-4', automation_id: 'auto-1', node_type: 'whatsapp', position: 3, config: {} },
  ],
  chat_rooms: [
    { id: 'room-1', business_id: DEMO_BUSINESS_ID, booking_id: 'bk-1', kind: 'customer_technician', created_at: daysAgo(0) },
  ],
  chat_messages: [
    { id: 'msg-1', chat_room_id: 'room-1', sender_id: techUserIds[0], body: "I'm about 8 minutes away, heading down Main St.", is_read: true, created_at: daysAgo(0) },
    { id: 'msg-2', chat_room_id: 'room-1', sender_id: custUserIds[0], body: 'Great, gate code is 4521', is_read: true, created_at: daysAgo(0) },
  ],
  support_tickets: [
    { id: 'tix-1', business_id: DEMO_BUSINESS_ID, raised_by: DEMO_USER_ID, subject: 'Need help configuring WhatsApp templates', description: 'Trying to set up the booking confirmation template.', status: 'open', created_at: daysAgo(2) },
    { id: 'tix-2', business_id: null, raised_by: DEMO_USER_ID, subject: 'Billing question about plan upgrade', description: 'Considering moving to Enterprise.', status: 'in_progress', created_at: daysAgo(6) },
  ],
  technician_locations: [
    { id: 'loc-1', technician_id: 'tech-1', business_id: DEMO_BUSINESS_ID, latitude: 30.2672, longitude: -97.7431, heading: 45, recorded_at: now() },
    { id: 'loc-2', technician_id: 'tech-2', business_id: DEMO_BUSINESS_ID, latitude: 30.271, longitude: -97.749, heading: 90, recorded_at: now() },
  ],
  technician_current_location: [
    { technician_id: 'tech-1', latitude: 30.2672, longitude: -97.7431 },
    { technician_id: 'tech-2', latitude: 30.271, longitude: -97.749 },
  ],
};

export const BOOKING_STATUS_FLOW = [
  'assigned', 'accepted', 'on_the_way', 'arrived', 'inspection',
  'working', 'completed', 'invoiced', 'paid',
];
