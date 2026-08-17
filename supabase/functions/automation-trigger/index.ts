// ServiceFlow AI — supabase/functions/automation-trigger
// Called by a Postgres webhook (Database Webhooks in the Supabase dashboard) whenever
// bookings/payments/invoices change. Looks up active automations for the business +
// trigger type, then POSTs the event to n8n, which executes the node graph
// (condition -> ai -> notification -> whatsapp -> email -> delay -> webhook).
//
// This function is intentionally thin: ServiceFlow AI owns triggers + data,
// n8n owns the node execution graph, so the "automation builder" UI in the admin
// app is really just an editor for n8n workflow JSON scoped per business.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const N8N_WEBHOOK_BASE = Deno.env.get('N8N_WEBHOOK_BASE'); // e.g. https://n8n.yourdomain.com/webhook
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface DbWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

serve(async (req) => {
  const payload: DbWebhookPayload = await req.json();
  const triggerType = resolveTriggerType(payload);
  if (!triggerType) return new Response('No matching trigger', { status: 200 });

  const businessId = payload.record.business_id as string;

  const { data: automations } = await supabase
    .from('automations')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('trigger_type', triggerType)
    .eq('is_active', true);

  if (!automations?.length) return new Response('No active automations', { status: 200 });

  for (const automation of automations) {
    try {
      if (N8N_WEBHOOK_BASE) {
        await fetch(`${N8N_WEBHOOK_BASE}/${automation.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger_type: triggerType, record: payload.record }),
        });
      }
      await supabase.from('automation_logs').insert({
        automation_id: automation.id,
        booking_id: (payload.record.id as string) ?? null,
        status: 'success',
        detail: { trigger_type: triggerType },
      });
    } catch (err) {
      await supabase.from('automation_logs').insert({
        automation_id: automation.id,
        status: 'failed',
        detail: { error: String(err) },
      });
    }
  }

  return new Response('dispatched', { status: 200 });
});

function resolveTriggerType(payload: DbWebhookPayload): string | null {
  if (payload.table === 'bookings' && payload.type === 'INSERT') return 'booking_created';
  if (
    payload.table === 'bookings' &&
    payload.type === 'UPDATE' &&
    payload.record.status !== payload.old_record?.status
  ) {
    if (payload.record.status === 'completed') return 'job_completed';
    return 'booking_status_changed';
  }
  if (payload.table === 'bookings' && payload.record.technician_id && !payload.old_record?.technician_id) {
    return 'technician_assigned';
  }
  if (payload.table === 'invoices' && payload.type === 'INSERT') return 'invoice_created';
  if (payload.table === 'payments' && payload.record.status === 'paid') return 'payment_received';
  return null;
}
