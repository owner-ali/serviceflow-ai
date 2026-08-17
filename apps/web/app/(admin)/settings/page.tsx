'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, ErrorState } from '@/components/StateViews';

interface Business {
  id: string;
  name: string;
  support_email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  brand_color: string;
}

interface Subscription {
  plan: string;
  status: string;
  technician_limit: number;
  booking_limit_per_month: number;
  ai_requests_limit_per_month: number;
}

export default function SettingsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [business, setBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const [{ data: biz, error: bErr }, { data: sub, error: sErr }] = await Promise.all([
          supabase.from('businesses').select('*').eq('id', businessId).single(),
          supabase.from('subscriptions').select('*').eq('business_id', businessId).single(),
        ]);
        if (bErr) throw bErr;
        if (sErr) throw sErr;
        setBusiness(biz as Business);
        setSubscription(sub as Subscription);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      }
    })();

    const stored = localStorage.getItem('sf-theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, [businessId]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('sf-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  async function saveBusiness() {
    if (!business) return;
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('businesses')
        .update({
          name: business.name,
          support_email: business.support_email,
          phone: business.phone,
          address: business.address,
          timezone: business.timezone,
          currency: business.currency,
          brand_color: business.brand_color,
        })
        .eq('id', business.id);
    } finally {
      setSaving(false);
    }
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!business || !subscription) return <LoadingRows />;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold dark:text-offwhite">Settings</h1>

      <section className="glass space-y-3 rounded-xl p-5 dark:text-offwhite">
        <h2 className="font-medium">Business profile</h2>
        {(['name', 'support_email', 'phone', 'address', 'timezone', 'currency'] as const).map((field) => (
          <div key={field}>
            <label className="text-xs text-graphite/50 dark:text-offwhite/50 capitalize">{field.replace('_', ' ')}</label>
            <input
              value={business[field] ?? ''}
              onChange={(e) => setBusiness({ ...business, [field]: e.target.value })}
              className="mt-1 w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            />
          </div>
        ))}
        <button
          onClick={saveBusiness}
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </section>

      <section className="glass space-y-2 rounded-xl p-5 dark:text-offwhite">
        <h2 className="font-medium">Subscription</h2>
        <p className="text-sm capitalize">
          Plan: <span className="font-semibold text-emerald-400">{subscription.plan}</span> ({subscription.status})
        </p>
        <p className="text-xs text-graphite/50 dark:text-offwhite/50">
          {subscription.technician_limit} technicians · {subscription.booking_limit_per_month} bookings/mo ·{' '}
          {subscription.ai_requests_limit_per_month} AI requests/mo
        </p>
      </section>

      <section className="glass flex items-center justify-between rounded-xl p-5 dark:text-offwhite">
        <div>
          <h2 className="font-medium">Appearance</h2>
          <p className="text-xs text-graphite/50 dark:text-offwhite/50">Dark or light mode, persisted on this device</p>
        </div>
        <button onClick={toggleTheme} className="rounded-full glass px-4 py-2 text-sm">
          {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </section>
    </div>
  );
}
