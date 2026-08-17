'use client';

import { motion } from 'framer-motion';

/**
 * Fades + slides content up as it scrolls into view. Used across the marketing
 * page (feature grid, section headers) — mirrors the reveal behavior in the
 * static HTML demo, but driven by framer-motion's viewport detection.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
