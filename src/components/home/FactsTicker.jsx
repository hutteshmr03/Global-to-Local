import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShellCockleIcon } from '../common/Icons';

const tickerItems = [
  "Handmade in Goa",
  "80% by women’s self-help groups",
  "Thirteen shelves",
  "Fontainhas, Panaji",
  "Shells off the Goan shore",
  "Packed in cane",
  "Open 10 AM to 9 PM, all week"
];

const revealSentence =
  "One shop in Fontainhas. Thirteen shelves. Nearly everything on them ground, dried, woven or fired by hand — most of it by women from self-help groups across Goa.";

export default function FactsTicker() {
  const words = revealSentence.split(' ');

  return (
    <section className="relative isolate overflow-hidden bg-ground">
      {/* Infinite Top Marquee Ticker */}
      <div className="relative z-10 border-y border-border/40 py-4">
        <div className="overflow-hidden flex">
          <motion.div
            className="flex w-max shrink-0 items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Repeated twice for infinite seamless loop */}
            {[0, 1].map((loopIdx) => (
              <ul
                key={loopIdx}
                className="flex shrink-0 items-center gap-8 pr-8 font-sans text-xs font-medium uppercase tracking-[0.14em] sm:gap-12 sm:pr-12 text-content-muted"
              >
                {tickerItems.map((item, idx) => (
                  <li key={idx} className="flex shrink-0 items-center gap-8 sm:gap-12">
                    <span className="whitespace-nowrap">{item}</span>
                    <ShellCockleIcon className="h-[18px] w-[18px] text-accent/70" />
                  </li>
                ))}
              </ul>
            ))}
          </motion.div>
        </div>
      </div>

      {/* "Why it is called Global to Local" Section (Clean background without floating shell motifs) */}
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-16 sm:py-24 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <ShellCockleIcon className="h-[18px] w-[18px]" />
            Why it is called Global to Local
          </p>
        </motion.div>

        {/* Slow, Refined Cinematic Word-by-Word Reveal */}
        <motion.p
          className="flex flex-wrap mt-7 max-w-[34ch] font-display text-[clamp(1.75rem,4.2vw,3.1rem)] font-semibold leading-[1.18] tracking-[-0.026em] text-content"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.075,
                delayChildren: 0.15,
              },
            },
          }}
        >
          {words.map((word, idx) => (
            <motion.span
              key={idx}
              variants={{
                hidden: {
                  opacity: 0.18,
                  y: 8,
                  filter: 'blur(1px)',
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                },
              }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mr-[0.28em] inline-block will-change-transform"
            >
              {word}
            </motion.span>
          ))}
        </motion.p>

        {/* Actions Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5"
        >
          <Link
            to="/our-social-corner"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-palm bg-palm px-7 py-3 text-sm font-semibold tracking-[-0.01em] text-content-ondark hover:bg-ink-deep hover:border-ink-deep transition-all duration-200 active:scale-[0.985] shadow-sm"
          >
            Meet the makers
          </Link>
          <p className="font-display text-lg italic text-content-muted">
            It's all about Goa
          </p>
        </motion.div>
      </div>
    </section>
  );
}
