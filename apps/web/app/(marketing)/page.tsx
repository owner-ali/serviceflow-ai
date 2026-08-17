import AiOrbHero from '@/components/AiOrbHero';
import ProductCarousel from '@/components/ProductCarousel';
import Reveal from '@/components/Reveal';
import ScrollProgress from '@/components/ScrollProgress';

const FEATURES = [
  { icon: '⚡', title: 'AI Service Analysis', desc: 'Instant triage from the problem description and photos — priority, skills, and price range before a technician even leaves.' },
  { icon: '📍', title: 'Live Technician Tracking', desc: 'Real-time GPS on every job, with a smoothly animated ETA the customer can watch update.' },
  { icon: '🧾', title: 'Parts + Labour Invoicing', desc: 'Technicians add parts and labour on-site; totals, tax, and the invoice generate automatically.' },
  { icon: '💬', title: 'Real-Time Chat', desc: 'Customer and technician stay connected the whole job, with read receipts and typing indicators.' },
  { icon: '🔁', title: 'n8n Automation', desc: 'Booking confirmations, reminders, and review requests — all fired automatically, zero code.' },
  { icon: '🏢', title: 'Multi-Tenant SaaS', desc: 'Row-level security isolates every business — Starter, Professional, and Enterprise plans built in.' },
];

export default function MarketingPage() {
  return (
    <main>
      <ScrollProgress />
      <AiOrbHero />
      <ProductCarousel />

      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold">Built for every field-service business</h2>
          <p className="mt-3 text-graphite/70 dark:text-offwhite/70">
            HVAC, electrical, plumbing, cleaning, appliance repair, solar, pest control,
            home maintenance, construction maintenance, and IT field technicians.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="glass group h-full rounded-2xl p-6 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5">
                <div className="mb-3 text-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125">
                  {f.icon}
                </div>
                <h4 className="mb-1 text-sm font-semibold">{f.title}</h4>
                <p className="text-xs text-graphite/60 dark:text-offwhite/60">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
