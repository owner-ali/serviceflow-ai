import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@serviceflow/api';

// Public-facing: lists active services for the business that owns this marketing
// site. Runs server-side with the service role key (never exposed to the
// browser) specifically so we don't have to open up RLS to anonymous visitors —
// the service role client bypasses RLS safely, scoped to exactly this query.
export async function GET() {
  const businessId = process.env.BOOKING_BUSINESS_ID;
  if (!businessId) {
    return NextResponse.json({ error: 'BOOKING_BUSINESS_ID not configured' }, { status: 500 });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, starting_price, estimated_duration_minutes')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ services: data });
}