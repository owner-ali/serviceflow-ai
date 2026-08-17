'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';

export function useBusinessId() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getUser();
        const id = (data?.user?.user_metadata as { business_id?: string })?.business_id;
        if (!id) throw new Error('No business context for current user');
        setBusinessId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resolve business');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { businessId, loading, error };
}
