'use client';

import { useEffect, useState } from 'react';

interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  starting_price: number;
  estimated_duration_minutes: number;
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low — anytime this week' },
  { value: 'normal', label: 'Normal — within a day or two' },
  { value: 'urgent', label: 'Urgent — as soon as possible' },
  { value: 'emergency', label: 'Emergency — right now' },
];

export default function PublicBookingForm() {
  const [services, setServices] = useState<ServiceOption[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    serviceId: '',
    problemDescription: '',
    address: '',
    urgency: 'normal',
    scheduledDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public-services')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setServices(data.services);
      })
      .catch((err) => setServicesError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/public-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Something went wrong');
      setBookingCode(result.bookingCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingCode) {
    return (
      <div className="glass mx-auto max-w-lg rounded-2xl p-8 text-center text-offwhite">
        <p className="text-3xl">✅</p>
        <h3 className="mt-3 text-xl font-semibold">Request received!</h3>
        <p className="mt-2 text-sm text-offwhite/60">
          Your booking reference is
        </p>
        <p className="mt-1 font-mono text-lg text-emerald-500">{bookingCode}</p>
        <p className="mt-4 text-sm text-offwhite/60">
          We'll reach out shortly to confirm your appointment.
        </p>
        <button
          onClick={() => {
            setBookingCode(null);
            setForm({ fullName: '', phone: '', email: '', serviceId: '', problemDescription: '', address: '', urgency: 'normal', scheduledDate: '' });
          }}
          className="mt-6 rounded-lg border border-graphite/20 px-4 py-2 text-sm dark:border-white/10"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass mx-auto max-w-lg space-y-4 rounded-2xl p-8 text-offwhite">
      <div>
        <h3 className="text-xl font-semibold">Request a service</h3>
        <p className="mt-1 text-sm text-offwhite/60">
          Tell us what you need — we'll get back to you fast.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          required
          placeholder="Full name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
        />
        <input
          required
          type="tel"
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
        />
      </div>

      <input
        type="email"
        placeholder="Email (optional)"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
      />

      {servicesError ? (
        <p className="text-sm text-red-400">Couldn't load services: {servicesError}</p>
      ) : (
        <select
          required
          value={form.serviceId}
          onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
        >
          <option value="" className="bg-forest-900">
            {services === null ? 'Loading services…' : 'Select a service'}
          </option>
          {services?.map((s) => (
            <option key={s.id} value={s.id} className="bg-forest-900">
              {s.name} — from ${s.starting_price}
            </option>
          ))}
        </select>
      )}

      <textarea
        placeholder="Describe the problem"
        rows={3}
        value={form.problemDescription}
        onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
      />

      <input
        required
        placeholder="Service address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <select
          value={form.urgency}
          onChange={(e) => setForm({ ...form, urgency: e.target.value })}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
        >
          {URGENCY_OPTIONS.map((u) => (
            <option key={u.value} value={u.value} className="bg-forest-900">
              {u.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.scheduledDate}
          onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-offwhite placeholder:text-white/40"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !services?.length}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Request Service'}
      </button>
    </form>
  );
}
