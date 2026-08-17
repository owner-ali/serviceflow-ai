'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
}

const NODE_TYPES = ['trigger', 'condition', 'ai', 'notification', 'whatsapp', 'email', 'update_db', 'delay', 'webhook'];

const TRIGGER_TYPES = [
  'booking_created', 'booking_status_changed', 'technician_assigned',
  'job_completed', 'invoice_created', 'payment_received', 'schedule',
];

export default function AutomationsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [automations, setAutomations] = useState<Automation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState(TRIGGER_TYPES[0]);
  const [nodes, setNodes] = useState<string[]>(['trigger']);

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('automations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setAutomations(data as Automation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function toggleActive(id: string, current: boolean) {
    const supabase = getSupabaseClient();
    await supabase.from('automations').update({ is_active: !current }).eq('id', id);
    load();
  }

  async function saveAutomation() {
    if (!businessId || !name) return;
    const supabase = getSupabaseClient();
    const { data: automation } = await supabase
      .from('automations')
      .insert({ business_id: businessId, name, trigger_type: triggerType, is_active: true })
      .select()
      .single();

    if (automation) {
      for (let i = 0; i < nodes.length; i++) {
        await supabase.from('automation_nodes').insert({ automation_id: automation.id, node_type: nodes[i], position: i, config: {} });
      }
    }

    setBuilding(false);
    setName('');
    setNodes(['trigger']);
    load();
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-offwhite">Automations</h1>
        <button onClick={() => setBuilding(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
          + New Automation
        </button>
      </div>

      {!automations ? (
        <LoadingRows />
      ) : automations.length === 0 ? (
        <EmptyState message="No automations yet — build your first workflow." />
      ) : (
        <div className="space-y-2">
          {automations.map((a) => (
            <div key={a.id} className="glass flex items-center justify-between rounded-xl p-4 dark:text-offwhite">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-graphite/50 dark:text-offwhite/50">Trigger: {a.trigger_type.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className={`rounded-full px-3 py-1 text-xs ${a.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-graphite/20 text-graphite/60'}`}
              >
                {a.is_active ? 'Active' : 'Paused'}
              </button>
            </div>
          ))}
        </div>
      )}

      {building && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="glass w-full max-w-lg rounded-xl p-6 dark:text-offwhite">
            <h2 className="text-lg font-semibold">Build an automation</h2>

            <input
              placeholder="Automation name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            />

            <label className="mt-4 block text-xs text-graphite/50 dark:text-offwhite/50">Trigger</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t} className="bg-forest-900">
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs text-graphite/50 dark:text-offwhite/50">Nodes (in order)</label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {nodes.map((n, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">{n}</span>
                  {i < nodes.length - 1 && <span className="text-graphite/40">→</span>}
                </div>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) setNodes([...nodes, e.target.value]);
                e.target.value = '';
              }}
              className="mt-2 w-full rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10"
            >
              <option value="">+ Add node…</option>
              {NODE_TYPES.map((n) => (
                <option key={n} value={n} className="bg-forest-900">
                  {n}
                </option>
              ))}
            </select>

            <div className="mt-6 flex gap-2">
              <button onClick={() => setBuilding(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm">
                Cancel
              </button>
              <button onClick={saveAutomation} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm text-white">
                Save
              </button>
            </div>
            <p className="mt-3 text-[11px] text-graphite/50 dark:text-offwhite/50">
              Saved nodes are executed by n8n via the <code>automation-trigger</code> edge
              function — each node here maps to an n8n workflow node (see{' '}
              <code>docs/n8n-example-workflow.json</code>).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
