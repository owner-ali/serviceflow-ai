// ServiceFlow AI — booking queries (shared between admin web + could be reused by mobile web views)

import { getSupabaseClient } from './client';
import type { Booking, BookingStatus } from '@serviceflow/types';

export async function createBooking(input: {
  business_id: string;
  customer_id: string;
  service_id: string;
  problem_description: string;
  urgency: string;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('bookings').insert(input).select().single();
  if (error) throw error;
  return data as Booking;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function assignTechnician(bookingId: string, technicianId: string): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .update({ technician_id: technicianId, status: 'assigned' })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function getBookingsForBusiness(businessId: string): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingsForTechnician(technicianId: string): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('technician_id', technicianId)
    .order('scheduled_date', { ascending: true });
  if (error) throw error;
  return data as Booking[];
}

export async function getBookingsForCustomer(customerId: string): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Booking[];
}
