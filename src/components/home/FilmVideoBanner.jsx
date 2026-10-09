import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FilmVideoBanner({
  title,
  description,
  videoSrc,
  poster,
  ctaText,
  ctaLink,
  alt = '',
  frondPosition = null,
}) {
  return (
    <section className="relative bg-ground px-[clamp(12px,2.5vw,32px)] py-[clamp(10px,1.6vw,22px)]">
      <div className="relative isolate overflow-hidden rounded-xl bg-ink-deep text-content-ondark min-h-[88vh]">
        {/* Background Video */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink-deep">
          <div className="absolute -inset-[12%] will-change-transform" style={{ transform: 'scale(1.08)' }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={poster}
              aria-hidden="true"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[1.18]"
            >
              {videoSrc && <source src={videoSrc} type="video/mp4" />}
            </video>
          </div>
          {alt && <span className="sr-only">{alt}</span>}
        </div>

        {/* Film Scrim Gradient Overlay */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

        {/* Optional Frond Decorative Accent */}
        {frondPosition === 'bottom-right' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-[1] hidden bg-content-ondark/15 sm:block h-[clamp(12rem,30vw,19rem)] w-[clamp(9rem,22vw,14rem)] -bottom-12 -right-10 rotate-[15deg] rounded-full blur-[40px]"
          />
        )}
        {frondPosition === 'top-left' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-[1] hidden bg-content-ondark/15 sm:block h-[clamp(12rem,30vw,19rem)] w-[clamp(9rem,22vw,14rem)] -left-10 -top-12 rotate-[195deg] rounded-full blur-[40px]"
          />
        )}

        {/* Content Container */}
        <div className="relative z-10 flex min-h-[88vh] flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[22rem] sm:max-w-[28rem] lg:max-w-[34rem]"
          >
            <h2 className="font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-content-ondark [text-shadow:0_2px_24px_rgba(18,38,43,0.55)]">
              {title}
            </h2>
            <p className="mt-5 max-w-[42ch] text-base sm:text-lg leading-relaxed text-content-ondark/95 [text-shadow:0_1px_14px_rgba(18,38,43,0.5)]">
              {description}
            </p>
            {ctaText && ctaLink && (
              <div className="mt-8">
                <Link
                  to={ctaLink}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-content-ondark bg-content-ondark px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-palm hover:bg-surface hover:border-surface hover:text-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
                >
                  {ctaText}
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
