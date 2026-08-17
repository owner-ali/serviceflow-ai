'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface CustomerRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_at: string | null;
}

export default function CustomersPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: qErr } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('total_spent', { ascending: false });
        if (qErr) throw qErr;
        setCustomers(data as CustomerRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      }
    })();
  }, [businessId]);

  async function openCustomer(c: CustomerRow) {
    setSelected(c);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('bookings')
      .select('id, booking_code, status, created_at, final_price')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false });
    setTimeline(data ?? []);
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!customers) return <LoadingRows />;

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold dark:text-offwhite">Customers</h1>
          <input
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-graphite/20 bg-transparent px-3 py-1.5 text-sm dark:border-white/10 dark:text-offwhite"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No customers found." />
        ) : (
          <div className="overflow-x-auto rounded-xl glass">
            <table className="w-full text-left text-sm dark:text-offwhite">
              <thead>
                <tr className="border-b border-white/10 text-graphite/50 dark:text-offwhite/50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3">Last Booking</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCustomer(c)}
                    className={`cursor-pointer border-b border-white/5 hover:bg-white/5 ${
                      selected?.id === c.id ? 'bg-white/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">{c.full_name}</td>
                    <td className="px-4 py-3">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">{c.total_bookings}</td>
                    <td className="px-4 py-3">${Number(c.total_spent).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString() : '—'}
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
          <p className="text-sm text-graphite/50 dark:text-offwhite/50">Select a customer to view their timeline.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{selected.full_name}</h2>
              <p className="text-xs text-graphite/50 dark:text-offwhite/50">{selected.address ?? 'No address on file'}</p>
              <p className="text-xs text-graphite/50 dark:text-offwhite/50">{selected.email ?? selected.phone}</p>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-graphite/50 dark:text-offwhite/50">
                Booking → Service → Invoice → Payment → Review
              </p>
              <ol className="space-y-3 border-l border-white/10 pl-4">
                {timeline.map((t) => (
                  <li key={t.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="font-mono text-xs">{t.booking_code}</p>
                    <p className="text-sm capitalize">{t.status.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-graphite/50 dark:text-offwhite/50">
                      {new Date(t.created_at).toLocaleDateString()} {t.final_price ? `· $${t.final_price}` : ''}
                    </p>
                  </li>
                ))}
                {timeline.length === 0 && <li className="text-xs text-graphite/50 dark:text-offwhite/50">No bookings yet.</li>}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
