'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface ReviewRow {
  id: string;
  overall_rating: number | null;
  service_rating: number | null;
  technician_rating: number | null;
  comment: string | null;
  business_response: string | null;
  customers?: { full_name: string };
  technicians?: { users?: { full_name: string } };
}

function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-graphite/40">—</span>;
  return <span className="text-amber-400">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>;
}

export default function ReviewsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('reviews')
        .select('*, customers(full_name), technicians(users(full_name))')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setReviews(data as ReviewRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function submitResponse(id: string) {
    const text = responseDrafts[id];
    if (!text) return;
    const supabase = getSupabaseClient();
    await supabase.from('reviews').update({ business_response: text }).eq('id', id);
    load();
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!reviews) return <LoadingRows />;

  const filtered = filter ? reviews.filter((r) => r.overall_rating === filter) : reviews;
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-offwhite">Reviews</h1>
        <div className="glass rounded-lg px-4 py-2 text-sm dark:text-offwhite">
          Average rating: <span className="font-semibold text-amber-400">{avg} ★</span>
        </div>
      </div>

      <div className="flex gap-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            onClick={() => setFilter(filter === n ? null : n)}
            className={`rounded-full px-3 py-1 text-xs ${filter === n ? 'bg-emerald-600 text-white' : 'glass dark:text-offwhite'}`}
          >
            {n}★
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No reviews yet." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="glass rounded-xl p-4 dark:text-offwhite">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.customers?.full_name ?? 'Customer'}</p>
                <Stars value={r.overall_rating} />
              </div>
              <p className="mt-1 text-xs text-graphite/50 dark:text-offwhite/50">
                Technician: {r.technicians?.users?.full_name ?? '—'}
              </p>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}

              {r.business_response ? (
                <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs">
                  <p className="text-graphite/50 dark:text-offwhite/50">Your response:</p>
                  <p>{r.business_response}</p>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="Write a response…"
                    value={responseDrafts[r.id] ?? ''}
                    onChange={(e) => setResponseDrafts({ ...responseDrafts, [r.id]: e.target.value })}
                    className="flex-1 rounded-lg border border-graphite/20 bg-transparent px-3 py-1.5 text-xs dark:border-white/10"
                  />
                  <button
                    onClick={() => submitResponse(r.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
