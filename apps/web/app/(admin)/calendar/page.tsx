'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, ErrorState } from '@/components/StateViews';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarBooking {
  id: string;
  booking_code: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  technician_id: string | null;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export default function CalendarPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [view, setView] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('bookings')
        .select('id, booking_code, scheduled_date, scheduled_time, status, technician_id')
        .eq('business_id', businessId)
        .not('scheduled_date', 'is', null);
      if (qErr) throw qErr;
      setBookings(data as CalendarBooking[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function rescheduleTo(date: string) {
    if (!dragId) return;
    const supabase = getSupabaseClient();
    await supabase.from('bookings').update({ scheduled_date: date }).eq('id', dragId);
    setDragId(null);
    load();
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!bookings) return <LoadingRows />;

  const days: Date[] =
    view === 'day'
      ? [anchor]
      : view === 'week'
      ? Array.from({ length: 7 }, (_, i) => {
          const d = startOfWeek(anchor);
          d.setDate(d.getDate() + i);
          return d;
        })
      : Array.from({ length: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate() }, (_, i) =>
          new Date(anchor.getFullYear(), anchor.getMonth(), i + 1)
        );

  const byDate = (d: Date) => {
    const key = d.toISOString().slice(0, 10);
    return bookings.filter((b) => b.scheduled_date === key);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold dark:text-offwhite">Calendar</h1>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${
                view === v ? 'bg-emerald-600 text-white' : 'glass dark:text-offwhite'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-2 ${view === 'month' ? 'grid-cols-7' : `grid-cols-${Math.min(days.length, 7)}`}`}>
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const dayBookings = byDate(d);
          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => rescheduleTo(key)}
              className="glass min-h-[120px] rounded-lg p-2 dark:text-offwhite"
            >
              <p className="text-xs text-graphite/50 dark:text-offwhite/50">
                {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </p>
              <div className="mt-1 space-y-1">
                {dayBookings.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    className="cursor-move rounded bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-200"
                    title={`${b.booking_code} · ${b.status}`}
                  >
                    {b.scheduled_time?.slice(0, 5) ?? ''} {b.booking_code}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-graphite/50 dark:text-offwhite/50">
        Drag a booking card onto another day to reschedule. Technician availability conflicts
        aren't checked yet — pair this with the `availability` table before going live.
      </p>
    </div>
  );
}
