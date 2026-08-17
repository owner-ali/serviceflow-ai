'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient, getBookingsForBusiness } from '@serviceflow/api';
import type { Booking, BookingStatus } from '@serviceflow/types';

const STATUS_COLOR: Record<BookingStatus, string> = {
  assigned: 'bg-slate-500/20 text-slate-300',
  accepted: 'bg-blue-500/20 text-blue-300',
  on_the_way: 'bg-amber-500/20 text-amber-300',
  arrived: 'bg-amber-500/20 text-amber-300',
  inspection: 'bg-amber-500/20 text-amber-300',
  working: 'bg-emerald-500/20 text-emerald-300',
  parts_required: 'bg-orange-500/20 text-orange-300',
  completed: 'bg-lime-500/20 text-lime-300',
  invoiced: 'bg-mint/20 text-mint',
  paid: 'bg-emerald-600/20 text-emerald-300',
  reviewed: 'bg-purple-500/20 text-purple-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const businessIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const businessId = (userData?.user?.user_metadata as { business_id?: string })?.business_id;
      if (!businessId) throw new Error('No business context');
      businessIdRef.current = businessId;
      setBookings(await getBookingsForBusiness(businessId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: new bookings slide in at the top, status changes flash the row green —
  // mirrors what the customer/technician apps trigger from their own writes.
  useEffect(() => {
    const supabase = getSupabaseClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      const businessId = businessIdRef.current;
      if (!businessId) return;
      channel = supabase
        .channel(`bookings_live_${businessId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `business_id=eq.${businessId}` },
          async (payload) => {
            await load();
            const id = (payload.new as Booking)?.id;
            if (id) {
              setFlashIds((prev) => new Set(prev).add(id));
              setTimeout(() => {
                setFlashIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, 1500);
            }
          }
        )
        .subscribe();
    };

    const timer = setTimeout(subscribe, 500); // wait for businessIdRef to populate from load()
    return () => {
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  if (!bookings) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-graphite/10 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="glass rounded-xl p-10 text-center dark:text-offwhite">
        <p className="text-sm text-graphite/60 dark:text-offwhite/60">No bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold dark:text-offwhite">Bookings</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl glass">
        <table className="w-full text-left text-sm dark:text-offwhite">
          <thead>
            <tr className="border-b border-white/10 text-graphite/50 dark:text-offwhite/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Address</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {bookings.map((b) => (
                <motion.tr
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: flashIds.has(b.id) ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0)',
                  }}
                  transition={{ duration: 0.4 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_code}</td>
                  <td className="px-4 py-3">
                    <motion.span
                      key={b.status}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-full px-2 py-1 text-xs ${STATUS_COLOR[b.status]}`}
                    >
                      {b.status.replace(/_/g, ' ')}
                    </motion.span>
                  </td>
                  <td className="px-4 py-3">{b.urgency}</td>
                  <td className="px-4 py-3">{b.scheduled_date ?? '—'} {b.scheduled_time ?? ''}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{b.address}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
