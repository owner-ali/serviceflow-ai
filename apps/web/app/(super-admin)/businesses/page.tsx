'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface BusinessRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  subscriptions?: { plan: string; status: string }[];
}

export default function SuperAdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('businesses')
        .select('*, subscriptions(plan, status)')
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setBusinesses(data as BusinessRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses. This page requires super_admin role.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    const supabase = getSupabaseClient();
    await supabase.from('businesses').update({ is_active: !current }).eq('id', id);
    load();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!businesses) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-offwhite">All Businesses</h1>
      {businesses.length === 0 ? (
        <EmptyState message="No businesses on the platform yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl glass">
          <table className="w-full text-left text-sm dark:text-offwhite">
            <thead>
              <tr className="border-b border-white/10 text-graphite/50 dark:text-offwhite/50">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 capitalize">{b.subscriptions?.[0]?.plan ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${b.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {b.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(b.id, b.is_active)} className="text-xs text-emerald-400 hover:underline">
                      {b.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
