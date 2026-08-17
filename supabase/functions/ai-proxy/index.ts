// ServiceFlow AI — supabase/functions/ai-proxy
// Deno edge function. Deploy: supabase functions deploy ai-proxy
// Secrets (never in client code): supabase secrets set ANTHROPIC_API_KEY=... OPENAI_API_KEY=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    // Verify the caller's JWT and get their business context (RLS-scoped client)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return new Response('Unauthorized', { status: 401 });

    const { type, input } = await req.json();

    if (type === 'service_analysis') {
      const result = await runServiceAnalysis(input);
      return json(result);
    }

    if (type === 'business_assistant') {
      const result = await runBusinessAssistant(input, supabase);
      return json(result);
    }

    return new Response('Unknown request type', { status: 400 });
  } catch (err) {
    console.error(err);
    return new Response('Internal error', { status: 500 });
  }
});

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function runServiceAnalysis(input: {
  problem_description: string;
  service_category: string;
}) {
  const prompt = `You are a field-service triage assistant. A customer reported this problem
in the "${input.service_category}" category: "${input.problem_description}"

Respond ONLY with JSON matching:
{
  "priority": "low"|"normal"|"urgent"|"emergency",
  "estimated_duration_minutes": number,
  "required_skills": string[],
  "estimated_price_min": number,
  "estimated_price_max": number
}`;

  const text = await callClaude(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  return {
    suggested_service: input.service_category,
    suggested_technician_id: null,
    disclaimer:
      'AI-generated estimate — final diagnosis and price may vary after technician inspection.',
    ...parsed,
  };
}

async function runBusinessAssistant(
  input: { question: string; business_id: string },
  supabase: ReturnType<typeof createClient>
) {
  // Pull RLS-scoped aggregates only — never raw cross-tenant rows — before asking the LLM.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status, created_at, final_price')
    .eq('business_id', input.business_id)
    .limit(200);

  const prompt = `You are a business analytics assistant for a field-service company.
Recent booking data (JSON): ${JSON.stringify(bookings ?? [])}

Question: "${input.question}"

Answer concisely in 2-4 sentences, using only the data provided.`;

  const answer = await callClaude(prompt);
  return { answer, data: { booking_count: bookings?.length ?? 0 } };
}
