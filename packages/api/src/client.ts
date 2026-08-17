// ServiceFlow AI — shared Supabase client (used by web + edge functions)
// Mobile apps (Flutter) use the supabase_flutter SDK directly with the same URL/anon key.
//
// DEMO MODE: when NEXT_PUBLIC_DEMO_MODE=true, getSupabaseClient() returns an
// in-memory mock (see mockClient.ts) instead of a real Supabase connection —
// the whole admin app runs with zero credentials, seeded with demo data and a
// simulated realtime feed. Set it to false (or unset) for the real project.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './mockClient';

let client: SupabaseClient | ReturnType<typeof createMockSupabaseClient> | null = null;

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function getSupabaseClient(url?: string, anonKey?: string): any {
  if (client) return client;

  if (isDemoMode()) {
    client = createMockSupabaseClient();
    return client;
  }

  const supabaseUrl = url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set NEXT_PUBLIC_DEMO_MODE=true in .env.local to run without a Supabase project.'
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  return client;
}

// Server-only client using the service role key — NEVER import this in client/mobile code.
export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing service role env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}
