import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@serviceflow/api';

interface PublicBookingPayload {
  fullName: string;
  phone: string;
  email?: string;
  serviceId: string;
  problemDescription: string;
  address: string;
  urgency: 'low' | 'normal' | 'urgent' | 'emergency';
  scheduledDate?: string;
}

// Public-facing: a visitor on the marketing site submits this without being
// logged in. Runs entirely server-side with the service role key so we don't
// need to open write access to anonymous users via RLS — the only thing
// exposed to the browser is this endpoint's request/response shape.
export async function POST(req: NextRequest) {
  const businessId = process.env.BOOKING_BUSINESS_ID;
  if (!businessId) {
    return NextResponse.json({ error: 'BOOKING_BUSINESS_ID not configured' }, { status: 500 });
  }

  try {
    const body: PublicBookingPayload = await req.json();
    const { fullName, phone, email, serviceId, problemDescription, address, urgency, scheduledDate } = body;

    if (!fullName || !phone || !serviceId || !address) {
      return NextResponse.json({ error: 'Name, phone, service, and address are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Reuse an existing customer by phone within this business, or create one.
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .maybeSingle();

    let customerId = existing?.id as string | undefined;

    if (!customerId) {
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({ business_id: businessId, full_name: fullName, phone, email: email || null, address })
        .select('id')
        .single();

      if (custError) return NextResponse.json({ error: custError.message }, { status: 400 });
      customerId = newCustomer.id;
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        business_id: businessId,
        customer_id: customerId,
        service_id: serviceId,
        status: 'assigned',
        urgency: urgency ?? 'normal',
        problem_description: problemDescription || null,
        address,
        scheduled_date: scheduledDate || null,
      })
      .select('booking_code')
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    return NextResponse.json({ bookingCode: booking.booking_code }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}