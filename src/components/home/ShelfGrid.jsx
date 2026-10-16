import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '../../lib/catalogue-hooks';

export default function ShelfGrid() {
  const { data: categories = [] } = useCategories();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCategory = categories[activeIndex] || categories[0] || {};

  return (
    <section className="py-16 sm:py-24 lg:py-28 bg-ground text-content">
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
            Everything Goan
          </h2>
          <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
            Art and handicraft, spices and grains, wellness, bakery, desserts — made in the state.
          </p>
        </motion.div>

        {/* 13 Shelves Interactive Grid */}
        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* Left Column: Numbered Category List */}
          <ul className="border-t border-border/40 divide-y divide-border/40">
            {categories.map((cat, idx) => {
              const numStr = String(idx + 1).padStart(2, '0');
              const isHovered = activeIndex === idx;

              return (
                <li key={cat.slug}>
                  <Link
                    to={`/product-category/${cat.slug}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onFocus={() => setActiveIndex(idx)}
                    className="group flex items-center gap-4 py-4 transition-colors duration-200 sm:gap-6 hover:border-content-subtle"
                  >
                    {/* Number */}
                    <span
                      className={`w-7 shrink-0 font-display text-sm font-semibold tabular-nums transition-colors ${
                        isHovered ? 'text-accent font-bold' : 'text-content-subtle group-hover:text-accent'
                      }`}
                    >
                      {numStr}
                    </span>

                    {/* Mobile Thumbnail */}
                    <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-md bg-surface-muted lg:hidden border border-border/40">
                      <img
                        src={cat.imageSrc}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </span>

                    {/* Category Title */}
                    <span
                      className={`min-w-0 flex-1 text-base sm:text-[1.0625rem] font-medium transition-colors ${
                        isHovered ? 'text-accent font-semibold' : 'text-content group-hover:text-accent'
                      }`}
                    >
                      {cat.name}
                    </span>

                    {/* Hover Arrow */}
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:text-accent" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Column: Sticky Preview Card (Desktop) */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/40 bg-surface shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeCategory.slug}
                    src={activeCategory.imageSrc}
                    alt={activeCategory.name}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="h-full w-full object-cover absolute inset-0"
                  />
                </AnimatePresence>
              </div>

              {/* Category Description */}
              <div className="mt-6">
                <h3 className="font-display text-xl font-semibold text-content">
                  {activeCategory.name}
                </h3>
                <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-content-muted">
                  {activeCategory.blurb}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
