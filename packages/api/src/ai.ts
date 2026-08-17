// ServiceFlow AI — AI module
// IMPORTANT: real OpenAI/Anthropic calls happen ONLY in supabase/functions/ai-proxy
// (server-side, key never touches client/mobile). This file is the typed contract
// both mock and real implementations satisfy, so swapping is a one-line change.

import type { AiServiceAnalysis } from '@serviceflow/types';

export interface ServiceAnalysisInput {
  problem_description: string;
  image_urls: string[];
  service_category: string;
  customer_history_summary?: string;
}

// Mock implementation — deterministic-ish, used until the ai-proxy edge function is wired.
export async function analyzeServiceRequestMock(
  input: ServiceAnalysisInput
): Promise<AiServiceAnalysis> {
  const urgent = /leak|spark|smoke|no power|flood|gas/i.test(input.problem_description);

  return {
    suggested_service: input.service_category,
    priority: urgent ? 'urgent' : 'normal',
    estimated_duration_minutes: urgent ? 45 : 90,
    required_skills: [input.service_category.toLowerCase()],
    suggested_technician_id: null, // resolved by matching logic in the admin app
    estimated_price_min: urgent ? 80 : 50,
    estimated_price_max: urgent ? 220 : 150,
    disclaimer: 'AI-generated estimate — final diagnosis and price may vary after technician inspection.',
  };
}

// Real implementation — calls the ai-proxy edge function (keeps API key server-side).
// In demo mode (no edge function deployed), short-circuits to a canned response so
// the AI Assistant page still feels alive with zero credentials.
export async function analyzeServiceRequest(
  input: ServiceAnalysisInput,
  supabaseFunctionsUrl: string,
  accessToken: string
): Promise<AiServiceAnalysis> {
  if (accessToken === 'demo-access-token') return analyzeServiceRequestMock(input);

  const res = await fetch(`${supabaseFunctionsUrl}/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ type: 'service_analysis', input }),
  });
  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
  return res.json();
}

export interface BusinessAssistantQuery {
  question: string;
  business_id: string;
}

export interface BusinessAssistantAnswer {
  answer: string;
  data?: Record<string, unknown>;
}

const DEMO_ANSWERS: Record<string, string> = {
  'how many bookings do we have today?': 'You have 3 bookings scheduled for today — one AC repair in progress, one electrical panel job on the way, and one arriving shortly.',
  'which technician is performing best?': 'Ahmed R. leads with 18 completed jobs and a 4.9★ average rating — about 22% above the team average.',
  'what was revenue this month?': 'Revenue this month is $18,420 so far, up roughly 12% compared to the same period last month.',
  'which services are growing?': 'AC Repair and Panel Upgrade bookings have grown the fastest over the last 30 days.',
  'which customers haven\u2019t returned?': 'Two customers with a single completed booking over 60 days ago haven\u2019t rebooked — worth a follow-up.',
  'show me delayed jobs.': 'One booking (SF-2026-001284) has been in "working" status longer than its estimated duration — worth checking in with the technician.',
};

function demoAnswerFor(question: string): string {
  const key = question.trim().toLowerCase();
  return (
    DEMO_ANSWERS[key] ??
    'This is a demo-mode response — connect the ai-proxy edge function with a real Anthropic API key to get answers grounded in your actual booking data.'
  );
}

// Business assistant — natural-language questions over the business's own data.
// Real implementation runs server-side: it fetches relevant aggregates (RLS-scoped)
// then asks the LLM to summarize — never sends raw cross-tenant data to the model.
// In demo mode, returns a canned answer instead of calling any network endpoint.
export async function askBusinessAssistant(
  query: BusinessAssistantQuery,
  supabaseFunctionsUrl: string,
  accessToken: string
): Promise<BusinessAssistantAnswer> {
  if (accessToken === 'demo-access-token') {
    await new Promise((r) => setTimeout(r, 500)); // mimic network latency for a natural feel
    return { answer: demoAnswerFor(query.question) };
  }

  const res = await fetch(`${supabaseFunctionsUrl}/ai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ type: 'business_assistant', input: query }),
  });
  if (!res.ok) throw new Error(`AI proxy error: ${res.status}`);
  return res.json();
}
