import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@serviceflow/api';

// Creates a technician: makes an auth user (service-role only — never exposed
// to the browser), links them to the calling business, and inserts the
// technicians row. Runs server-side only; the service role key never reaches
// the client bundle.
export async function POST(req: NextRequest) {
  try {
    const { email, fullName, businessId, serviceArea } = await req.json();

    if (!email || !fullName || !businessId) {
      return NextResponse.json({ error: 'email, fullName, and businessId are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Creates the auth user with a random temporary password and sends them
    // an invite email (they'll set their own password via the emailed link).
    const { data: created, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: 'technician', business_id: businessId },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = created.user.id;

    // The auth trigger (handle_new_auth_user) already inserted a matching
    // public.users row from the metadata above — this just adds the
    // technician-specific row that references it.
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .insert({
        business_id: businessId,
        user_id: userId,
        service_area: serviceArea ?? null,
        is_available: true,
        is_active: true,
      })
      .select()
      .single();

    if (techError) {
      return NextResponse.json({ error: techError.message }, { status: 400 });
    }

    return NextResponse.json({ technician }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}