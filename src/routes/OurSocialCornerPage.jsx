import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ArrowUpRight, ArrowRight } from 'lucide-react';
import { ShellCockleIcon } from '../components/common/Icons';
import ShellDrift from '../components/common/ShellDrift';
import StoreBanner from '../components/home/StoreBanner';
import { useReviews } from '../lib/catalogue-hooks';

function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const fallbackVisitorsReviews = [
  {
    stars: 5,
    quote:
      'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
    author: 'Gifty Abraham',
    role: ''
  },
  {
    stars: 5,
    quote:
      "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
    author: 'Stedwick Fernandes',
    role: ''
  },
  {
    stars: 5,
    quote:
      'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
    author: 'Swapna Pujari',
    role: 'SilhouetteIndia'
  }
];

export default function OurSocialCornerPage() {
  const { data: visitorsReviews = fallbackVisitorsReviews } = useReviews("Visitors' Book", fallbackVisitorsReviews);
  return (
    <main id="main" className="min-w-0 bg-ground pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-1">
        <section className="relative isolate overflow-hidden rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
          {/* Floating shell motifs */}
          <ShellDrift tone="dark" />

          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 pt-12 sm:pt-16 pb-8 sm:pb-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-between gap-6 sm:gap-8"
            >
              <div className="max-w-2xl">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-content-ondark">
                  Our Social Corner
                </h1>
                <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-content-ondark-muted leading-relaxed max-w-2xl">
                  80% of our products are made by women from self-help groups. This is the part of the store that matters most to us.
                </p>
              </div>

              <div className="flex justify-end pt-2 sm:pt-4">
                <a
                  href="https://www.instagram.com/globaltolocalgoa/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-pill border border-border bg-surface px-6 py-2.5 sm:py-3 text-sm font-semibold text-content hover:bg-surface-muted hover:border-content-subtle transition-all duration-200 active:scale-[0.985] shadow-sm"
                >
                  <InstagramIcon className="h-4 w-4 text-accent" />
                  <span>Follow on Instagram</span>
                  <ArrowUpRight className="h-4 w-4 text-content-subtle" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. VIDEO FEATURE BANNER: A SOCIAL VENTURE FIRST */}
      <section className="relative bg-ground px-[clamp(12px,2.5vw,32px)] py-4 sm:py-6">
        <div className="relative isolate overflow-hidden rounded-2xl bg-ink-deep text-content-ondark min-h-[75vh] lg:min-h-[85vh] flex flex-col justify-end shadow-xl">
          {/* Background Video */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink-deep">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/videos/maker-poster.jpg"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[1.18] scale-[1.04]"
            >
              <source src="/videos/maker.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Film Scrim */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

          {/* Banner Content */}
          <div className="relative z-10 flex flex-col justify-end px-6 pb-12 pt-24 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.04] text-content-ondark [text-shadow:0_2px_24px_rgba(18,38,43,0.55)]">
                A social venture first, a supermarket second
              </h2>
              <p className="mt-5 text-base sm:text-lg text-content-ondark/90 leading-relaxed [text-shadow:0_1px_14px_rgba(18,38,43,0.5)]">
                Conceptualised during the pandemic to support women and keep Goan making in the state. Since its inception, 100+ Goan women have been made financially independent.
              </p>
              <div className="mt-8">
                <Link
                  to="/shop"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-content-ondark bg-content-ondark px-7 py-3 text-sm font-semibold tracking-[-0.01em] text-palm hover:bg-surface hover:border-surface hover:text-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
                >
                  <span>Shop the shelves</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. FROM THE VISITORS' BOOK (REVIEWS) */}
      <section className="py-16 sm:py-20 lg:py-24 mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">
              <ShellCockleIcon className="h-[18px] w-[18px]" />
              <span>From the visitors' book</span>
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content">
              What people say after they visit
            </h2>
            <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
              Reviews left by customers of the Fontainhas store.
            </p>
          </motion.div>

          {/* 3 Review Cards */}
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {visitorsReviews.map((rev, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-surface p-7 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* 5 Stars */}
                  <div className="flex gap-1 text-accent" role="img" aria-label="5 out of 5 stars">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  {/* Quote */}
                  <blockquote className="mt-5 text-sm sm:text-base leading-relaxed text-content-muted">
                    “{rev.quote}”
                  </blockquote>
                </div>

                {/* Author */}
                <div className="mt-6 border-t border-border/30 pt-4">
                  <span className="block font-display text-sm sm:text-base font-semibold text-content">
                    {rev.author}
                  </span>
                  {rev.role && (
                    <span className="mt-0.5 block text-xs text-content-subtle">
                      {rev.role}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM STORE BANNER */}
      <StoreBanner />
    </main>
  );
}
