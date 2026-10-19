import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function FilmVideoCard({ banner, idx }) {
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    // Only play on desktop hover if video is available and has hovered interaction
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore aborted play request if cursor quickly moves away
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative isolate overflow-hidden rounded-2xl bg-ink-deep text-content-ondark min-h-[65vh] sm:min-h-[72vh] flex flex-col justify-end p-6 sm:p-8 lg:p-10 shadow-lg group"
    >
      {/* Background Video or Image */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink-deep">
        <div className="absolute -inset-[10%] w-[120%] h-[120%] will-change-transform">
          {banner.videoSrc ? (
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              preload="metadata"
              poster={banner.poster}
              aria-hidden="true"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[1.18] transition-transform duration-700 group-hover:scale-[1.04]"
            >
              <source src={banner.videoSrc} type="video/mp4" />
            </video>
          ) : (
            <img
              src={banner.imageSrc || banner.poster}
              alt={banner.alt || ''}
              loading="lazy"
              className="h-full w-full object-cover brightness-[0.82] contrast-[1.08] saturate-[1.18] transition-transform duration-700 group-hover:scale-[1.04]"
            ></img>
          )}
        </div>
        {banner.alt && <span className="sr-only">{banner.alt}</span>}
      </div>

      {/* Exact Live Film Scrim Overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

      {/* Content Box */}
      <div className="relative z-10 max-w-xl lg:max-w-2xl">
        <h2 className="font-display text-[clamp(1.85rem,3.2vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-content-ondark [text-shadow:0_2px_20px_rgba(18,38,43,0.6)]">
          {banner.title}
        </h2>
        <div className="mt-3.5 max-w-xl lg:max-w-2xl text-sm sm:text-base leading-relaxed text-content-ondark/95 [text-shadow:0_1px_12px_rgba(18,38,43,0.5)]">
          {banner.description}
        </div>
        {banner.ctaText && banner.ctaLink && (
          <div className="mt-6">
            <Link
              to={banner.ctaLink}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-content-ondark bg-content-ondark px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-semibold tracking-[-0.01em] text-palm hover:bg-surface hover:border-surface hover:text-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
            >
              {banner.ctaText}
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FilmVideoDuo({ banners }) {
  return (
    <section className="relative bg-ground px-[clamp(12px,2.5vw,32px)] py-[clamp(10px,1.6vw,22px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {banners.map((banner, idx) => (
          <FilmVideoCard key={banner.title} banner={banner} idx={idx} />
        ))}
      </div>
    </section>
  );
}

