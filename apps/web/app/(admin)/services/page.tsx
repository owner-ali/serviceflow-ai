'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  starting_price: number;
  estimated_duration_minutes: number;
  is_active: boolean;
}

export default function ServicesPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [services, setServices] = useState<ServiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', starting_price: '', estimated_duration_minutes: '60' });
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('services')
        .select('id, name, description, starting_price, estimated_duration_minutes, is_active')
        .eq('business_id', businessId)
        .order('name');
      if (qErr) throw qErr;
      setServices(data as ServiceRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !form.name || !form.starting_price) return;
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from('services').insert({
        business_id: businessId,
        name: form.name,
        description: form.description || null,
        starting_price: Number(form.starting_price),
        estimated_duration_minutes: Number(form.estimated_duration_minutes),
        is_active: true,
      });
      setForm({ name: '', description: '', starting_price: '', estimated_duration_minutes: '60' });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = getSupabaseClient();
    await supabase.from('services').update({ is_active: !current }).eq('id', id);
    load();
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-semibold dark:text-offwhite">Services</h1>
        {!services ? (
          <LoadingRows />
        ) : services.length === 0 ? (
          <EmptyState message="No services yet — add one on the right." />
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="glass flex items-center justify-between rounded-xl p-4 dark:text-offwhite">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-graphite/50 dark:text-offwhite/50">
                    From ${s.starting_price} · {s.estimated_duration_minutes} min
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(s.id, s.is_active)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    s.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-graphite/20 text-graphite/60'
                  }`}
                >
                  {s.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={addService} className="glass h-fit space-y-3 rounded-xl p-5 dark:text-offwhite">
        <h2 className="font-semibold">Add a service</h2>
        <input
          placeholder="Service name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          rows={2}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Starting price"
            value={form.starting_price}
            onChange={(e) => setForm({ ...form, starting_price: e.target.value })}
            className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            required
          />
          <input
            type="number"
            placeholder="Duration (min)"
            value={form.estimated_duration_minutes}
            onChange={(e) => setForm({ ...form, estimated_duration_minutes: e.target.value })}
            className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add Service'}
        </button>
      </form>
    </div>
  );
}
