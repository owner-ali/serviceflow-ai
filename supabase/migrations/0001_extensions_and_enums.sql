-- ServiceFlow AI — Phase 1: Extensions & Enums
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists postgis;   -- for geo columns (technician_locations, service areas)
create extension if not exists moddatetime; -- for auto-updating updated_at columns

-- ---------- ENUMS ----------

create type user_role as enum (
  'super_admin',   -- platform-level, manages all businesses
  'business_admin', -- owns/manages a business (tenant)
  'manager',
  'technician',
  'customer'
);

create type subscription_plan as enum ('starter', 'professional', 'enterprise');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create type booking_status as enum (
  'assigned',
  'accepted',
  'on_the_way',
  'arrived',
  'inspection',
  'working',
  'parts_required',
  'completed',
  'invoiced',
  'paid',
  'reviewed',
  'cancelled'
);

create type booking_urgency as enum ('low', 'normal', 'urgent', 'emergency');

create type payment_status as enum ('pending', 'processing', 'paid', 'failed', 'refunded');

create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');

create type notification_channel as enum ('push', 'email', 'whatsapp', 'sms', 'in_app');

create type notification_status as enum ('queued', 'sent', 'delivered', 'failed', 'read');

create type ai_request_type as enum ('service_analysis', 'business_assistant', 'insight_generation');

create type automation_trigger_type as enum (
  'booking_created', 'booking_status_changed', 'technician_assigned',
  'job_completed', 'invoice_created', 'payment_received', 'schedule'
);

create type support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
