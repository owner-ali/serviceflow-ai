'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  created_at: string;
  businesses?: { name: string };
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-red-500/20 text-red-300',
  in_progress: 'bg-amber-500/20 text-amber-300',
  resolved: 'bg-emerald-500/20 text-emerald-300',
  closed: 'bg-graphite/20 text-graphite/60',
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('support_tickets')
        .select('*, businesses(name)')
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setTickets(data as Ticket[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = getSupabaseClient();
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    load();
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!tickets) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-offwhite">Support Tickets</h1>
      {tickets.length === 0 ? (
        <EmptyState message="No support tickets." />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="glass rounded-xl p-4 dark:text-offwhite">
              <div className="flex items-center justify-between">
                <p className="font-medium">{t.subject}</p>
                <select
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value)}
                  className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLE[t.status]}`}
                >
                  {Object.keys(STATUS_STYLE).map((s) => (
                    <option key={s} value={s} className="bg-forest-900 text-offwhite">
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-graphite/50 dark:text-offwhite/50">
                {t.businesses?.name ?? 'Platform-level'} · {new Date(t.created_at).toLocaleDateString()}
              </p>
              {t.description && <p className="mt-2 text-sm">{t.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
