'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  { title: 'Smart Booking', desc: 'Customers book in under a minute.' },
  { title: 'AI Analysis', desc: 'Instant triage from problem + photos.' },
  { title: 'Technician Assignment', desc: 'Best-fit tech, matched by skill and location.' },
  { title: 'Live Map', desc: 'Real-time technician tracking for every job.' },
  { title: 'Job Management', desc: 'Full status workflow, fully audited.' },
  { title: 'Chat', desc: 'Customer and technician, connected in real time.' },
  { title: 'Invoice', desc: 'Parts, labour, tax — generated automatically.' },
  { title: 'Payment', desc: 'Stripe & PayPal-ready, secure checkout.' },
  { title: 'Automation', desc: 'n8n-compatible workflows, zero code.' },
  { title: 'Analytics', desc: 'Revenue, retention, and performance at a glance.' },
];

export default function ProductCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <section className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden bg-forest-900">
      <button
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-6 z-10 rounded-full glass p-3 text-offwhite hover:bg-white/10"
      >
        ‹
      </button>

      <div className="relative flex w-full max-w-3xl items-center justify-center">
        <AnimatePresence mode="popLayout">
          {SLIDES.map((slide, i) => {
            const offset = i - index;
            if (Math.abs(offset) > 1) return null;
            return (
              <motion.div
                key={slide.title}
                className="glass absolute w-72 rounded-2xl p-8 text-center"
                initial={false}
                animate={{
                  x: offset * 220,
                  scale: offset === 0 ? 1 : 0.8,
                  opacity: offset === 0 ? 1 : 0.4,
                  filter: offset === 0 ? 'blur(0px)' : 'blur(2px)',
                  zIndex: offset === 0 ? 10 : 1,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                drag={offset === 0 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) next();
                  if (info.offset.x > 80) prev();
                }}
              >
                <h3 className="text-xl font-semibold text-mint">{slide.title}</h3>
                <p className="mt-2 text-sm text-offwhite/70">{slide.desc}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <button
        aria-label="Next slide"
        onClick={next}
        className="absolute right-6 z-10 rounded-full glass p-3 text-offwhite hover:bg-white/10"
      >
        ›
      </button>

      <div className="absolute bottom-6 flex gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            aria-label={`Go to ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
