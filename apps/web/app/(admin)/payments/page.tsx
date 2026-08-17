'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface PaymentRow {
  id: string;
  provider: string;
  amount: number;
  status: string;
  paid_at: string | null;
  invoices?: { invoice_number: string };
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-slate-500/20 text-slate-300',
  processing: 'bg-amber-500/20 text-amber-300',
  paid: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
  refunded: 'bg-purple-500/20 text-purple-300',
};

export default function PaymentsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: qErr } = await supabase
          .from('payments')
          .select('*, invoices(invoice_number)')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (qErr) throw qErr;
        setPayments(data as PaymentRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      }
    })();
  }, [businessId]);

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!payments) return <LoadingRows />;

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold dark:text-offwhite">Payments</h1>
        <div className="glass rounded-lg px-4 py-2 text-sm dark:text-offwhite">
          Total collected: <span className="font-semibold text-emerald-400">${totalPaid.toLocaleString()}</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <EmptyState message="No payments recorded yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl glass">
          <table className="w-full text-left text-sm dark:text-offwhite">
            <thead>
              <tr className="border-b border-white/10 text-graphite/50 dark:text-offwhite/50">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{p.invoices?.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.provider}</td>
                  <td className="px-4 py-3">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-graphite/50 dark:text-offwhite/50">
        Rows update automatically once <code>stripe-webhook</code> is deployed with real
        Stripe keys — this page only reads from the `payments` table.
      </p>
    </div>
  );
}
