// ServiceFlow AI — supabase/functions/whatsapp-sender
// Called by automations (booking_created, technician_on_the_way, job_completed, etc).
// Secrets: supabase secrets set WHATSAPP_API_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

interface WhatsAppRequest {
  to: string; // E.164 phone number
  template: string; // pre-approved WhatsApp template name
  params: string[]; // template variable substitutions, in order
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return new Response('WhatsApp not configured', { status: 501 });
  }

  const { to, template, params }: WhatsAppRequest = await req.json();

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: 'en_US' },
          components: [
            {
              type: 'body',
              parameters: params.map((p) => ({ type: 'text', text: p })),
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('WhatsApp send failed', errText);
    return new Response('Send failed', { status: 502 });
  }

  return new Response('sent', { status: 200 });
});

/* Template map used by the automation builder (WhatsApp templates are pre-approved,
   so wording changes require re-submitting the template to Meta):

  booking_confirmation      -> "Hi {{1}}, your booking {{2}} is confirmed for {{3}}."
  technician_assigned        -> "{{1}} has been assigned to your job {{2}}."
  technician_on_the_way        -> "{{1}} is on the way — ETA {{2}} minutes."
  job_completed               -> "Your job {{1}} is complete. View invoice: {{2}}"
  appointment_reminder         -> "Reminder: your appointment is tomorrow at {{1}}."
  review_request                 -> "How did we do? Rate your service: {{1}}"
*/
