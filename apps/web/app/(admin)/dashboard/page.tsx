'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { getSupabaseClient } from '@serviceflow/api';
import AnimatedCounter from '@/components/AnimatedCounter';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardStats {
  revenue: number;
  todays_bookings: number;
  active_technicians: number;
  completed_jobs: number;
  pending_payments: number;
  new_customers: number;
  average_rating: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  pulsing,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  pulsing?: boolean;
}) {
  return (
    <motion.div variants={item} whileHover={{ y: -3 }} className="glass rounded-xl p-5 dark:text-offwhite">
      <div className="flex items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-graphite/50 dark:text-offwhite/50">{label}</p>
        {pulsing && <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>}
      </div>
      <p className="mt-2 text-2xl font-semibold">
        <AnimatedCounter target={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [liveFlash, setLiveFlash] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();
      const bizId = (userData?.user?.user_metadata as { business_id?: string })?.business_id;
      if (!bizId) throw new Error('No business context for current user');
      setBusinessId(bizId);

      const [{ count: todaysBookings }, { count: activeTechs }, { count: completed }] =
        await Promise.all([
          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', bizId)
            .gte('scheduled_date', new Date().toISOString().slice(0, 10)),
          supabase
            .from('technicians')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', bizId)
            .eq('is_available', true),
          supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', bizId)
            .eq('status', 'completed'),
        ]);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, payment_status')
        .eq('business_id', bizId);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('overall_rating')
        .eq('business_id', bizId);

      const revenue = (invoices ?? [])
        .filter((i) => i.payment_status === 'paid')
        .reduce((sum, i) => sum + Number(i.total), 0);
      const pendingPayments = (invoices ?? []).filter((i) => i.payment_status === 'pending').length;
      const ratings = (reviews ?? []).map((r) => r.overall_rating).filter(Boolean) as number[];
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      setStats({
        revenue,
        todays_bookings: todaysBookings ?? 0,
        active_technicians: activeTechs ?? 0,
        completed_jobs: completed ?? 0,
        pending_payments: pendingPayments,
        new_customers: 0,
        average_rating: avgRating,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: any booking/invoice change for this business quietly refreshes the
  // stat cards and briefly pulses the "live" indicator — no manual refresh needed.
  useEffect(() => {
    if (!businessId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`dashboard_live_${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `business_id=eq.${businessId}` },
        () => {
          setLiveFlash(true);
          load();
          setTimeout(() => setLiveFlash(false), 1200);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `business_id=eq.${businessId}` },
        () => {
          setLiveFlash(true);
          load();
          setTimeout(() => setLiveFlash(false), 1200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-graphite/10 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 text-center dark:text-offwhite">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold dark:text-offwhite">Dashboard</h1>
        <motion.span
          animate={liveFlash ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-400"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </motion.span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <StatCard label="Revenue" value={stats.revenue} prefix="$" pulsing={liveFlash} />
        <StatCard label="Today's Bookings" value={stats.todays_bookings} pulsing={liveFlash} />
        <StatCard label="Active Technicians" value={stats.active_technicians} />
        <StatCard label="Completed Jobs" value={stats.completed_jobs} pulsing={liveFlash} />
        <StatCard label="Pending Payments" value={stats.pending_payments} />
        <StatCard label="New Customers" value={stats.new_customers} />
        <StatCard label="Average Rating" value={stats.average_rating} decimals={1} suffix=" ★" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="glass rounded-xl p-4"
      >
        <Chart
          type="area"
          height={280}
          series={[{ name: 'Revenue', data: [12, 19, 14, 25, 22, 30, 28] }]}
          options={{
            chart: {
              toolbar: { show: false },
              background: 'transparent',
              animations: { enabled: true, easing: 'easeinout', speed: 800 },
            },
            theme: { mode: 'dark' },
            colors: ['#10b981'],
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
            dataLabels: { enabled: false },
            fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
          }}
        />
      </motion.div>
    </div>
  );
}
