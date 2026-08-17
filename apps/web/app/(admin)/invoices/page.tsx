'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';
import { generateInvoicePdf } from '@/lib/generateInvoicePdf';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_status: string;
  bookings?: { booking_code: string; customers?: { full_name: string } };
}

export default function InvoicesPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!businessId) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error: qErr } = await supabase
        .from('invoices')
        .select('*, bookings(booking_code, customers(full_name))')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setInvoices(data as InvoiceRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    }
  }

  useEffect(() => {
    load();
  }, [businessId]);

  async function openInvoice(inv: InvoiceRow) {
    setSelected(inv);
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setItems(data ?? []);
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!invoices) return <LoadingRows />;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-semibold dark:text-offwhite">Invoices</h1>
        {invoices.length === 0 ? (
          <EmptyState message="No invoices yet." />
        ) : (
          <div className="overflow-x-auto rounded-xl glass">
            <table className="w-full text-left text-sm dark:text-offwhite">
              <thead>
                <tr className="border-b border-white/10 text-graphite/50 dark:text-offwhite/50">
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => openInvoice(inv)}
                    className="cursor-pointer border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3">{inv.bookings?.customers?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">${Number(inv.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          inv.payment_status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass rounded-xl p-5 dark:text-offwhite">
        {!selected ? (
          <p className="text-sm text-graphite/50 dark:text-offwhite/50">Select an invoice to preview.</p>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-sm">{selected.invoice_number}</h2>
              <span className="text-xs">{selected.bookings?.booking_code}</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-white/5">
                    <td className="py-1.5">{it.name}</td>
                    <td className="py-1.5 text-right">
                      {it.quantity} × ${it.unit_price}
                    </td>
                    <td className="py-1.5 text-right">${it.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>${selected.subtotal}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${selected.tax}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-${selected.discount}</span></div>
              <div className="flex justify-between font-semibold text-sm"><span>Total</span><span>${selected.total}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  generateInvoicePdf({
                    invoiceNumber: selected.invoice_number,
                    bookingCode: selected.bookings?.booking_code ?? '',
                    customerName: selected.bookings?.customers?.full_name ?? 'Customer',
                    businessName: 'ServiceFlow AI',
                    items: items.map((it) => ({
                      name: it.name,
                      quantity: Number(it.quantity),
                      unit_price: Number(it.unit_price),
                      total: Number(it.total),
                    })),
                    subtotal: Number(selected.subtotal),
                    tax: Number(selected.tax),
                    discount: Number(selected.discount),
                    total: Number(selected.total),
                    paymentStatus: selected.payment_status,
                  })
                }
                className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs text-white"
              >
                Download PDF
              </button>
              <button className="flex-1 rounded-lg border border-white/10 py-2 text-xs">Email</button>
            </div>
            <p className="mt-2 text-[11px] text-graphite/50 dark:text-offwhite/50">
              PDF is generated client-side — no external service or API key needed. Email
              sending still needs a real email provider wired into an edge function.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
