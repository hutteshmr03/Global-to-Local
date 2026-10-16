import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Award, ArrowUpRight } from 'lucide-react';
import StoreBanner from '../components/home/StoreBanner';
import ShellDrift from '../components/common/ShellDrift';
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

export default function InTheNewsPage() {
  const { data: pressData } = usePress({ articles: fallbackPressArticles, awards: fallbackAwards });
  const pressArticles = pressData?.articles?.length ? pressData.articles : fallbackPressArticles;
  const awards = pressData?.awards?.length ? pressData.awards : fallbackAwards;
  return (
    <main id="main" className="min-w-0 bg-ground pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-1">
        <section className="relative isolate overflow-hidden rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
          {/* Floating shell motifs */}
          <ShellDrift tone="dark" />

          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-14 sm:py-18 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-content-ondark">
                In the News
              </h1>
              <p className="mt-5 text-base sm:text-lg lg:text-xl text-content-ondark-muted leading-relaxed max-w-2xl">
                What has been written about the store, the women who make its products, and the idea behind it.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. PRESS ARTICLES GRID */}
      <section className="py-16 sm:py-20 lg:py-24 bg-ground text-content">
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
