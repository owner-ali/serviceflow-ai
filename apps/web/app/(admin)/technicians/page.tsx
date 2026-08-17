'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface TechnicianRow {
  id: string;
  user_id: string;
  rating: number;
  jobs_completed: number;
  earnings_total: number;
  is_available: boolean;
  is_active: boolean;
  service_area: string | null;
  users?: { full_name: string; email: string };
}

export default function TechniciansPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [technicians, setTechnicians] = useState<TechnicianRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', serviceArea: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('technicians')
        .select('*, users(full_name, email)')
        .eq('business_id', businessId)
        .order('rating', { ascending: false });
      if (qErr) throw qErr;
      setTechnicians(data as TechnicianRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load technicians');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function toggleActive(id: string, current: boolean) {
    const supabase = getSupabaseClient();
    await supabase.from('technicians').update({ is_active: !current }).eq('id', id);
    load();
  }

  async function submitAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId || !form.email || !form.fullName) return;
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName,
          businessId,
          serviceArea: form.serviceArea || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Failed to add technician');

      setFormSuccess(`Invite sent to ${form.email}. They'll appear here once their account is set up.`);
      setForm({ email: '', fullName: '', serviceArea: '' });
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add technician');
    } finally {
      setSaving(false);
    }
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!technicians) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-offwhite">Technicians</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white"
        >
          + Add Technician
        </button>
      </div>

      {technicians.length === 0 ? (
        <EmptyState message="No technicians yet — add your first one." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians.map((t) => (
            <div key={t.id} className="glass rounded-xl p-5 dark:text-offwhite">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{t.users?.full_name ?? 'Technician'}</p>
                  <p className="text-xs text-graphite/50 dark:text-offwhite/50">{t.users?.email}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${t.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-base font-semibold">{t.rating.toFixed(1)}</p>
                  <p className="text-graphite/50 dark:text-offwhite/50">Rating</p>
                </div>
                <div>
                  <p className="text-base font-semibold">{t.jobs_completed}</p>
                  <p className="text-graphite/50 dark:text-offwhite/50">Jobs</p>
                </div>
                <div>
                  <p className="text-base font-semibold">${Number(t.earnings_total).toLocaleString()}</p>
                  <p className="text-graphite/50 dark:text-offwhite/50">Earnings</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-graphite/50 dark:text-offwhite/50">
                {t.service_area ?? 'No service area set'} · {t.is_available ? 'Available' : 'Offline'}
              </p>

              <button
                onClick={() => toggleActive(t.id, t.is_active)}
                className="mt-4 w-full rounded-lg border border-graphite/20 py-1.5 text-xs dark:border-white/10"
              >
                {t.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <form
            onSubmit={submitAddTechnician}
            className="glass w-full max-w-md space-y-3 rounded-xl p-6 dark:text-offwhite"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Add technician</h2>
            <p className="text-xs text-graphite/60 dark:text-offwhite/60">
              They'll get an email invite to set their password and join the technician app.
            </p>

            <input
              type="text"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
              required
            />
            <input
              type="text"
              placeholder="Service area (optional)"
              value={form.serviceArea}
              onChange={(e) => setForm({ ...form, serviceArea: e.target.value })}
              className="w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            />

            {formError && <p className="text-xs text-red-400">{formError}</p>}
            {formSuccess && <p className="text-xs text-emerald-400">{formSuccess}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? 'Sending invite…' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
