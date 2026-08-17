'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface Insight {
  id: string;
  category: string;
  title: string;
  summary: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const [{ data: insightData, error: iErr }, { data: bookingData, error: bErr }] = await Promise.all([
          supabase.from('ai_insights').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
          supabase.from('bookings').select('status').eq('business_id', businessId),
        ]);
        if (iErr) throw iErr;
        if (bErr) throw bErr;
        setInsights(insightData as Insight[]);
        const counts: Record<string, number> = {};
        (bookingData ?? []).forEach((b: any) => {
          counts[b.status] = (counts[b.status] ?? 0) + 1;
        });
        setStatusCounts(counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    })();
  }, [businessId]);

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!insights) return <LoadingRows />;

  const labels = Object.keys(statusCounts);
  const values = Object.values(statusCounts);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold dark:text-offwhite">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <p className="mb-2 text-sm font-medium dark:text-offwhite">Bookings by status</p>
          {labels.length > 0 && (
            <Chart
              type="donut"
              height={280}
              series={values}
              options={{
                labels: labels.map((l) => l.replace(/_/g, ' ')),
                theme: { mode: 'dark' },
                legend: { position: 'bottom' },
                colors: ['#10b981', '#6ee7b7', '#bef264', '#059669', '#34d399', '#a7f3d0', '#065f46'],
              }}
            />
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium dark:text-offwhite">AI-generated insights</p>
          {insights.length === 0 ? (
            <EmptyState message="No insights generated yet." />
          ) : (
            insights.map((i) => (
              <div key={i.id} className="glass rounded-xl p-4 dark:text-offwhite">
                <p className="text-xs uppercase tracking-wide text-emerald-400">{i.category.replace(/_/g, ' ')}</p>
                <p className="mt-1 font-medium">{i.title}</p>
                <p className="mt-1 text-sm text-graphite/60 dark:text-offwhite/60">{i.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
