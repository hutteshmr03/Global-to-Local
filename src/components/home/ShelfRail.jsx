import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories, useAllProducts } from '../../lib/catalogue-hooks';

export default function ShelfRail() {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useAllProducts();

  const shelfRailRef = useRef(null);
  const [railProgress, setRailProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Track horizontal scrolling of the 13 shelves rail
  const updateRailScrollState = () => {
    const el = shelfRailRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setRailProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const current = el.scrollLeft;
    const pct = Math.min(100, Math.max(0, (current / maxScroll) * 100));
    setRailProgress(pct);
    setCanScrollLeft(current > 8);
    setCanScrollRight(current < maxScroll - 8);
  };

  useEffect(() => {
    const el = shelfRailRef.current;
    if (!el) return;
    updateRailScrollState();
    el.addEventListener('scroll', updateRailScrollState, { passive: true });
    window.addEventListener('resize', updateRailScrollState);
    return () => {
      el.removeEventListener('scroll', updateRailScrollState);
      window.removeEventListener('resize', updateRailScrollState);
    };
  }, [categories]);

  const scrollRail = (direction) => {
    const el = shelfRailRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.snap-start');
    if (!cards.length) {
      const cardWidth = el.clientWidth * 0.75;
      const delta = direction === 'left' ? -cardWidth : cardWidth;
      el.scrollBy({ left: delta, behavior: 'smooth' });
      return;
    }

    const currentLeft = el.scrollLeft;
    let targetLeft = currentLeft;

    if (direction === 'right') {
      for (let i = 0; i < cards.length; i++) {
        const cardOffset = cards[i].offsetLeft - el.offsetLeft;
        if (cardOffset > currentLeft + 15) {
          targetLeft = cardOffset;
          break;
        }
      }
      if (targetLeft === currentLeft) {
        targetLeft = el.scrollWidth - el.clientWidth;
      }
    } else {
      for (let i = cards.length - 1; i >= 0; i--) {
        const cardOffset = cards[i].offsetLeft - el.offsetLeft;
        if (cardOffset < currentLeft - 15) {
          targetLeft = cardOffset;
          break;
        }
      }
      if (targetLeft === currentLeft) {
        targetLeft = 0;
      }
    }

    el.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-10 sm:py-12 lg:py-14 mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content">
            Everything Goan
          </h2>
          <p className="mt-2.5 sm:mt-3 max-w-2xl text-base sm:text-lg text-content-muted leading-relaxed">
            Art and handicraft, spices and grains, wellness, bakery, desserts — more exclusively from the state.
          </p>
        </motion.div>
      </div>

      {/* 13 Category Cards Rail */}
      <div className="mt-6 sm:mt-8">
        <div className="relative">
          <div
            ref={shelfRailRef}
            onScroll={updateRailScrollState}
            role="region"
            aria-label="Product categories"
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:gap-6 hide-scrollbar rail-gutter scroll-smooth"
          >
            {categories.map((cat) => {
              const count = products.filter((p) => {
                const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
                return pCat === cat.slug;
              }).length;

              return (
                <Link
                  key={cat.slug}
                  to={`/shop?category=${cat.slug}#catalogue`}
                  className="group w-[62vw] shrink-0 snap-start sm:w-[34vw] lg:w-[19rem]"
                >
                  <div className="overflow-hidden rounded-2xl border border-border/60 hover:border-content-subtle transition-all duration-300 bg-surface shadow-xs hover:shadow-md">
                    <div className="relative overflow-hidden bg-surface-sunken aspect-video">
                      <img
                        alt={cat.imageAlt || cat.name}
                        src={cat.imageSrc}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      />
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-base sm:text-[1.0625rem] font-semibold transition-colors group-hover:text-accent text-content">
                          {cat.name}
                        </h3>
                        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-content-subtle">
                          {count}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-content-muted">
                        {cat.blurb}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Scroll Navigation Controls */}
          <div className="mt-4 sm:mt-5 flex items-center gap-5 rail-gutter">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40" role="presentation">
              <div
                className="h-full rounded-full bg-accent will-change-[width] transition-[width] duration-150 ease-out"
                style={{ width: `${Math.max(8, railProgress)}%` }}
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={!canScrollLeft}
                onClick={() => scrollRail('left')}
                aria-label="Scroll shelf left"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-surface shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canScrollRight}
                onClick={() => scrollRail('right')}
                aria-label="Scroll shelf right"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-surface shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
