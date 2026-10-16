import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Award, ArrowUpRight } from 'lucide-react';
import StoreBanner from '../components/home/StoreBanner';
import ShellDrift from '../components/common/ShellDrift';
import { TropicalSunIcon } from '../components/common/Icons';
import { usePress } from '../lib/catalogue-hooks';

const fallbackPressArticles = [
  {
    publication: 'The Navhind Times',
    date: 'October 2020',
    title: 'Global to Local supermarket opens in city',
    url: 'https://www.navhindtimes.in/2020/10/28/business/global-to-local-supermarket-opens-in-city/'
  },
  {
    publication: 'Business Goa',
    date: 'March 2021',
    title: 'Global to Local in Business Goa',
    url: 'https://businessgoa.in/tag/global-to-local/'
  },
  {
    publication: 'Gomantak Times',
    date: 'August 2022',
    title: 'Global to Local empowers rural Goan women entrepreneurs',
    url: 'https://www.gomantaktimes.com/news/business/global-to-local-empowers-rural-goan-women-entrepreneurs'
  },
  {
    publication: 'The Goan',
    date: 'February 2025',
    title: 'Feature on Global to Local',
    url: '#'
  },
  {
    publication: 'Herald',
    date: 'November 2024',
    title: 'Global to Local in the Herald',
    url: '#'
  }
];

const fallbackAwards = [
  {
    title: 'Award for supporting local livelihoods',
    desc: 'Recognised for providing structured retail access and financial independence to 100+ Goan women from self-help groups.'
  },
  {
    title: 'Award for women-led enterprise',
    desc: 'Honouring founder Asha Arondekar and the network of village micro-producers across North and South Goa.'
  }
];

// Conversation & Voice Motifs for "They are Talking"
function SpeechBubbleDialogueIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 28C12 18 20 10 32 10C44 10 52 18 52 28C52 38 44 46 32 46C29 46 26.2 45.4 23.6 44.2L12 48L14.6 39.8C13 36.4 12 32.3 12 28Z" />
      <line x1="22" y1="24" x2="42" y2="24" />
      <line x1="22" y1="30" x2="36" y2="30" />
      <line x1="22" y1="36" x2="30" y2="36" />
    </svg>
  );
}

function SpeechBubbleSmallIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 22C10 14 16 8 25 8C34 8 40 14 40 22C40 30 34 36 25 36C22.6 36 20.3 35.5 18.2 34.6L9 38L11 31.4C10.4 28.5 10 25.4 10 22Z" />
      <circle cx="19" cy="22" r="1.5" fill="currentColor" />
      <circle cx="25" cy="22" r="1.5" fill="currentColor" />
      <circle cx="31" cy="22" r="1.5" fill="currentColor" />
    </svg>
  );
}

function VoiceWaveIcon({ className = 'h-auto w-full' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 12C9.8 14.2 9.8 17.8 8 20" />
      <path d="M14 9C17 12.8 17 19.2 14 23" />
      <path d="M20 6C24.5 11.2 24.5 20.8 20 26" />
    </svg>
  );
}

export default function InTheNewsPage() {
  const { data: pressData } = usePress({ articles: fallbackPressArticles, awards: fallbackAwards });
  const pressArticles = pressData?.articles?.length ? pressData.articles : fallbackPressArticles;
  const awards = pressData?.awards?.length ? pressData.awards : fallbackAwards;
  return (
    <main id="main" className="min-w-0 bg-ground pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-1">
        <section className="relative isolate overflow-hidden rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
          {/* Animated Background Motifs tailored for "They are Talking" */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-content-ondark opacity-[0.14]"
          >
            {/* Drifting Golden Sunburst Motif */}
            <motion.span
              className="absolute block -left-6 top-[8%] w-24 lg:w-32"
              animate={{
                y: [0, 8, 0],
                rotate: [-6, -2, -6],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <TropicalSunIcon />
            </motion.span>

            {/* Conversation Dialogue Bubble on the right */}
            <motion.span
              className="absolute block right-[9%] sm:right-[11%] top-[14%] w-16 sm:w-20 lg:w-24"
              animate={{
                y: [0, -8, 0],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <SpeechBubbleDialogueIcon />
            </motion.span>

            {/* Companion Dialogue Bubble on the right */}
            <motion.span
              className="absolute block right-[2.5%] sm:right-[3.5%] bottom-[12%] w-12 sm:w-16 lg:w-20"
              animate={{
                y: [0, 7, 0],
                rotate: [3, -2, 3],
              }}
              transition={{
                duration: 8.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.8,
              }}
            >
              <SpeechBubbleSmallIcon />
            </motion.span>

            {/* Voice Sound Waves */}
            <motion.span
              className="absolute block right-[16%] sm:right-[18%] bottom-[18%] w-7 sm:w-9 opacity-80"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <VoiceWaveIcon />
            </motion.span>
          </div>

          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-7 sm:py-9 lg:py-11">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-content-ondark">
                They are Talking
              </h1>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. PRESS ARTICLES GRID */}
      <section className="py-10 sm:py-14 lg:py-16 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pressArticles.map((article, idx) => {
              const hasExternalLink = article.url && article.url !== '#';

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-300 hover:shadow-md hover:border-content-subtle h-full"
                >
                  {hasExternalLink ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex h-full flex-col justify-between p-6 sm:p-7 group"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-3">
                          <span className="inline-flex items-center rounded-pill border border-border/70 bg-surface-muted px-3 py-1 text-xs font-semibold text-content">
                            {article.publication}
                          </span>
                          {article.date && (
                            <span className="text-xs text-content-subtle font-medium">
                              {article.date}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-3 font-display text-lg sm:text-xl font-semibold leading-snug text-content transition-colors group-hover:text-accent">
                          {article.title}
                        </h2>
                      </div>
                      <div className="mt-6 pt-4 border-t border-border/30 flex items-center gap-1.5 text-xs font-semibold text-accent">
                        <span>Read the article</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </a>
                  ) : (
                    <div className="flex h-full flex-col justify-between p-6 sm:p-7">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-3">
                          <span className="inline-flex items-center rounded-pill border border-border/70 bg-surface-muted px-3 py-1 text-xs font-semibold text-content">
                            {article.publication}
                          </span>
                          {article.date && (
                            <span className="text-xs text-content-subtle font-medium">
                              {article.date}
                            </span>
                          )}
                        </div>
                        <h2 className="mt-3 font-display text-lg sm:text-xl font-semibold leading-snug text-content">
                          {article.title}
                        </h2>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. AWARDS AND HONOURS */}
      <section className="py-16 sm:py-20 lg:py-24 mx-[clamp(12px,2.5vw,32px)] my-4 overflow-clip rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content-ondark">
              Awards and honours
            </h2>
            <p className="mt-4 text-base sm:text-lg text-content-ondark-muted leading-relaxed">
              Recognition for work supporting local livelihoods across Goa.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {awards.map((award, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-7 sm:p-8 backdrop-blur-xs transition-all duration-300 hover:border-white/30"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-pill bg-accent/20 text-accent">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-content-ondark">
                      {award.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-content-ondark-muted">
                      {award.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BOTTOM STORE BANNER */}
      <StoreBanner />
    </main>
  );
}
