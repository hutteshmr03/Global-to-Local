import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShellCockleIcon } from '../common/Icons';
import ShellDrift from '../common/ShellDrift';

const shellItems = [
  {
    id: 6163,
    title: 'Shell Lamp- Round',
    subtitle: 'Shell craft, Goan shore',
    price: 1200,
    slug: 'shell-lamp--round',
    image: '/images/catalog/shell-lamp--round.jpg',
  },
  {
    id: 6167,
    title: 'Shell Mirror- Round',
    subtitle: 'Shell craft, Goan shore',
    price: 1200,
    slug: 'shell-mirror--round',
    image: '/images/catalog/shell-mirror--round.jpg',
  },
  {
    id: 6176,
    title: 'Shell Tortoise- Large',
    subtitle: 'Shell craft, Goan shore',
    price: 300,
    slug: 'shell-tortoise--large',
    image: '/images/catalog/shell-tortoise--large.jpg',
  },
  {
    id: 6140,
    title: 'Conche Shells',
    subtitle: 'Shell craft, Goan shore',
    price: 70,
    slug: 'conche-shells',
    image: '/images/catalog/conche-shells.jpg',
  },
  {
    id: 6168,
    title: 'Shell Peacock',
    subtitle: 'Shell craft, Goan shore',
    price: 360,
    slug: 'shell-peacock',
    image: '/images/catalog/shell-peacock.jpg',
  },
  {
    id: 6141,
    title: 'Cowrie Shells',
    subtitle: 'Shell craft, Goan shore',
    price: 70,
    slug: 'cowrie-shells',
    image: '/images/catalog/cowrie-shells.jpg',
  },
  {
    id: 6157,
    title: 'Shell Fisherwoman',
    subtitle: 'Shell craft, Goan shore',
    price: 420,
    slug: 'shell-fisherwoman',
    image: '/images/catalog/shell-fisherwoman.jpg',
  },
  {
    id: 6180,
    title: 'Coconut Shell Spoon – Large',
    subtitle: 'Shell craft, Goan shore',
    price: 180,
    slug: 'coconut-shell-spoon-8211-large',
    image: '/images/catalog/coconut-shell-spoon-8211-large.jpg',
  },
  {
    id: 6155,
    title: 'Shell Crane',
    subtitle: 'Shell craft, Goan shore',
    price: 300,
    slug: 'shell-crane',
    image: '/images/catalog/shell-crane.jpg',
  },
  {
    id: 6177,
    title: 'Whelks Shells',
    subtitle: 'Shell craft, Goan shore',
    price: 70,
    slug: 'whelks-shells',
    image: '/images/catalog/whelks-shells.jpg',
  },
];

export default function ShellShelf() {
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const currentScroll = el.scrollLeft;
    const progress = Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100));
    setScrollProgress(progress);
    setCanScrollLeft(currentScroll > 10);
    setCanScrollRight(currentScroll < maxScroll - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    updateScrollState();
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.snap-start');
    if (!cards.length) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
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
    <section className="py-16 sm:py-24 lg:py-28 bg-ground text-content relative isolate">
      {/* Background Drifting Motifs */}
      <ShellDrift tone="light" />

      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <ShellCockleIcon className="h-[18px] w-[18px]" />
            Picked off the shore
          </p>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[24ch] font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
              Shells that came back as lamps, mirrors and a tortoise
            </h2>
            <Link
              to="/product-category/hand-crafted"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-border bg-surface px-6 py-2.5 text-sm font-semibold tracking-[-0.01em] text-content hover:bg-surface-muted hover:border-border-subtle transition-all duration-200 active:scale-[0.985] shadow-xs"
            >
              All hand-crafted
            </Link>
          </div>

          <p className="mt-4 max-w-[52ch] text-base sm:text-lg text-content-muted leading-relaxed">
            Cowries, conches and whelks off the Goan coast, cut and set by hand. Swipe the shelf.
          </p>
        </motion.div>
      </div>

      {/* Horizontal Draggable Carousel */}
      <div className="relative z-10 mt-12">
        <div className="relative">
          {/* Scrollable track */}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            tabIndex={0}
            aria-label="Shell craft shelf"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 sm:px-8 lg:px-12 pb-4 pt-1 hide-scrollbar scroll-smooth"
          >
            {shellItems.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="group w-[68vw] shrink-0 snap-start sm:w-[40vw] lg:w-[22.5rem]"
              >
                <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface shadow-xs transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-md">
                  {/* Square Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-surface-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    />
                  </div>

                  {/* Card Info */}
                  <div className="flex items-baseline justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[1.0625rem] font-semibold text-content group-hover:text-accent transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-content-subtle">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 font-sans text-base sm:text-lg font-bold tabular-nums tracking-tight text-content">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Progress Bar & Navigation Controls */}
          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell mt-6 flex items-center gap-5">
            {/* Progress Track */}
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full bg-accent rounded-full will-change-[width] transition-[width] duration-150 ease-out"
                style={{ width: `${Math.max(10, scrollProgress)}%` }}
              />
            </div>

            {/* Left & Right Button Controls */}
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll shelf left"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll shelf right"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 shadow-xs"
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
