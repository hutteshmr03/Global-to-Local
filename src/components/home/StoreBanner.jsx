import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ShellDrift from '../common/ShellDrift';

export default function StoreBanner() {
  return (
    <section className="py-16 sm:py-24 lg:py-28 mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
        <div className="relative overflow-hidden rounded-2xl border border-border-ondark/30 bg-palm px-7 py-14 text-content-ondark palm-shade sm:px-14 sm:py-20 shadow-xl">
          {/* Drifting Shell Illustrations */}
          <ShellDrift tone="dark" />

          {/* Banner Content */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-4xl"
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content-ondark">
              Take a little bit of Goa home
            </h2>
            <p className="mt-5 text-base sm:text-lg text-content-ondark-muted leading-relaxed sm:whitespace-nowrap">
              Stop by our store in the Latin Quarters, Fontainhas. Open all through the week, 10 AM to 9 PM.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-content-ondark bg-content-ondark px-7 py-3 text-sm font-semibold tracking-[-0.01em] text-palm hover:bg-surface hover:border-surface hover:text-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
              >
                Shop the shelves
              </Link>
              <Link
                to="/contact"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-content-ondark/40 bg-transparent px-7 py-3 text-sm font-semibold tracking-[-0.01em] text-content-ondark hover:border-content-ondark hover:bg-content-ondark/10 transition-all duration-200 active:scale-[0.985]"
              >
                Find us & FAQs
              </Link>
            </div>

            {/* Address & Phone */}
            <p className="mt-8 text-xs sm:text-sm text-content-ondark-muted">
              Tarcar Mansion, Fontainhas, Panaji, Goa 403001 · +91 80103 67153
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
