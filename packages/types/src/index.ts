// ServiceFlow AI — shared types (mirrors supabase/migrations schema)

export type UserRole = 'super_admin' | 'business_admin' | 'manager' | 'technician' | 'customer';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export type BookingStatus =
  | 'assigned' | 'accepted' | 'on_the_way' | 'arrived' | 'inspection'
  | 'working' | 'parts_required' | 'completed' | 'invoiced' | 'paid'
  | 'reviewed' | 'cancelled';

export type BookingUrgency = 'low' | 'normal' | 'urgent' | 'emergency';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms' | 'in_app';
export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'read';

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  timezone: string;
  currency: string;
  phone: string | null;
  support_email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AppUser {
  id: string;
  business_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Customer {
  id: string;
  business_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  total_bookings: number;
  total_spent: number;
}

export interface Technician {
  id: string;
  business_id: string;
  user_id: string;
  photo_url: string | null;
  bio: string | null;
  service_area: string | null;
  rating: number;
  jobs_completed: number;
  earnings_total: number;
  is_available: boolean;
  is_active: boolean;
}

export interface Service {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  starting_price: number;
  estimated_duration_minutes: number;
  required_skills: string[];
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_code: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  technician_id: string | null;
  status: BookingStatus;
  urgency: BookingUrgency;
  problem_description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  ai_estimated_price_min: number | null;
  ai_estimated_price_max: number | null;
  ai_estimated_duration_minutes: number | null;
  ai_suggested_priority: string | null;
  final_price: number | null;
  signature_url: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  booking_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  pdf_url: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  kind: 'part' | 'labour';
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  booking_id: string;
  customer_id: string;
  technician_id: string | null;
  service_rating: number | null;
  technician_rating: number | null;
  overall_rating: number | null;
  comment: string | null;
}

export interface AiServiceAnalysis {
  suggested_service: string;
  priority: BookingUrgency;
  estimated_duration_minutes: number;
  required_skills: string[];
  suggested_technician_id: string | null;
  estimated_price_min: number;
  estimated_price_max: number;
  disclaimer: string;
}
