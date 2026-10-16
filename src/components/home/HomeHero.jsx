import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { siteConfig } from '../../lib/data';

export default function HomeHero() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.28;

    if (isPlayingAudio) {
      audio.play().catch(() => setIsPlayingAudio(false));
    } else {
      audio.pause();
    }
  }, [isPlayingAudio]);

  return (
    <section className="relative isolate min-h-dvh flex flex-col justify-end overflow-hidden bg-[#7A7366] text-content-ondark">
      {/* Background Video - Scaled to push black letterbox & watermark offscreen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-ink-deep">
        <div className="absolute -inset-[10%] w-[120%] h-[120%] will-change-transform">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/videos/street-poster.jpg"
            className="h-full w-full object-cover pointer-events-none brightness-[0.82] contrast-[1.08] saturate-[1.18] scale-[1.06]"
          >
            <source src="/videos/street.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Exact Live Film Scrim */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

      {/* Hidden Audio */}
      <audio ref={audioRef} src="/audio/fontainhas-street.wav" loop preload="none" />

      {/* Main Hero Content */}
      <div className="relative z-10 flex min-h-dvh flex-col justify-end mx-auto max-w-shell px-5 pb-[max(3.6rem,calc(3.2rem+env(safe-area-inset-bottom)))] sm:px-8 sm:pb-8 lg:px-12 lg:pb-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="max-w-[24rem] sm:max-w-[36rem] lg:max-w-[46rem]"
        >
          {/* Tagline */}
          <p className="font-display text-xl sm:text-2xl lg:text-3xl italic text-content-ondark [text-shadow:0_1px_16px_rgba(18,38,43,0.45)]">
            {siteConfig.tagline}
          </p>

          {/* Heading (2 lines with big font) */}
          <h1 className="mt-2.5 font-display text-[clamp(2.75rem,5.6vw,4.8rem)] font-bold leading-[1.0] tracking-[-0.03em] text-content-ondark [text-shadow:0_2px_24px_rgba(18,38,43,0.6)]">
            An exclusive Goan
            <br />
            supermarket.
          </h1>

          {/* Subheading (3 lines with big font) */}
          <p className="mt-4 max-w-[40ch] font-sans text-base sm:text-lg lg:text-xl font-normal leading-[1.42] text-content-ondark/95 [text-shadow:0_1px_12px_rgba(18,38,43,0.45)]">
            Local patios, Konkani on the speakers,
            <br className="hidden sm:inline" />
            {' '}shelves made by women across the
            <br className="hidden sm:inline" />
            {' '}state. Open all through the week, 10 AM to 9 PM.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex cursor-pointer items-center justify-center rounded-pill border border-content-ondark bg-content-ondark px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-semibold tracking-[-0.01em] text-palm hover:bg-surface hover:border-surface hover:text-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
            >
              Shop the shelves
            </Link>
            <Link
              to="/contact"
              className="inline-flex cursor-pointer items-center justify-center rounded-pill border border-content-ondark/40 bg-ink-deep/30 backdrop-blur-xs px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-semibold tracking-[-0.01em] text-content-ondark hover:border-content-ondark hover:bg-content-ondark/15 transition-all duration-200 active:scale-[0.985]"
            >
              Visit Fontainhas
            </Link>
          </div>

          {/* Address - Always in a single row */}
          <p className="mt-3.5 whitespace-nowrap text-[12px] sm:text-sm text-content-ondark/85 tracking-tight [text-shadow:0_1px_8px_rgba(18,38,43,0.45)]">
            {siteConfig.contact.address}
          </p>
        </motion.div>
      </div>

      {/* Vertical SCROLL Indicator (Right side) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-5 z-20 hidden flex-col items-center gap-4 sm:right-8 sm:flex lg:right-12"
      >
        <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-content-ondark/80 [writing-mode:vertical-rl] [text-shadow:0_1px_4px_rgba(18,38,43,0.6)]">
          Scroll
        </span>
        <span className="relative block h-14 w-px overflow-hidden bg-content-ondark/40 shadow-xs">
          <motion.span
            className="absolute inset-x-0 top-0 block h-5 bg-content-ondark"
            animate={{ y: [-20, 56] }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.4 }}
          />
        </span>
      </div>

      {/* "Hear the street" Audio Control (Bottom Right) */}
      <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:right-8 lg:right-12">
        <button
          type="button"
          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
          aria-pressed={isPlayingAudio}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-pill border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 select-none shadow-md ${
            isPlayingAudio
              ? 'border-content-ondark bg-content-ondark text-palm shadow-lg font-semibold'
              : 'border-content-ondark/35 bg-ink-deep/45 text-content-ondark hover:border-content-ondark/60 hover:bg-content-ondark/15'
          }`}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">Quiet the street</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">Hear the street</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
