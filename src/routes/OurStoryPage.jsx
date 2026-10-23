import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { TropicalSunIcon, CoastalWaveIcon, PalmLeafIcon } from '../components/common/Icons';
import ShellDrift from '../components/common/ShellDrift';
import StoreBanner from '../components/home/StoreBanner';

const pillars = [
  {
    num: '01',
    title: 'Everything is Goan in origin',
    body: 'All our products are made in Goa and of Goan origin.'
  },
  {
    num: '02',
    title: 'Made by women, at scale',
    body: 'Handmade and Homemade by the women and we also store local goan brands.'
  },
  {
    num: '03',
    title: 'Walk in for an experience and learn more about Goa',
    body: 'Our staff educate you on the uniqueness, creativity, and process that goes into making Goa so culturally enriched.'
  },
  {
    num: '04',
    title: 'We courier it home',
    body: 'We courier across state and country, so nostalgia can be brought to your doorstep no matter where you are.'
  }
];

const stats = [
  { value: '100+', label: 'Goan women made financially independent' },
  { value: '100%', label: 'Local authentic products' },
  { value: '200+', label: 'Products, all Goan in origin' },
  { value: '10 AM to 9 PM', label: 'Open every day of the week' }
];

export default function OurStoryPage() {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Ensure video is muted if autoplay is restricted by browser policy
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [videoError]);

  return (
    <main id="main" className="min-w-0 bg-ground">
      {/* 1. HERO SECTION */}
      <section className="relative isolate overflow-hidden bg-ground pt-24 sm:pt-28">
        <ShellDrift tone="light" />

        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 grid items-center gap-8 sm:gap-12 pt-2 sm:pt-4 lg:pt-6 pb-8 sm:pb-14 lg:grid-cols-2 lg:gap-16 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[0.98] text-content tracking-tight">
              We are your favourite store.
            </h1>
            <p className="mt-7 max-w-xl text-lg sm:text-xl text-content-muted leading-relaxed">
              Global to Local is a one of a kind supermarket with locally made and sourced Goan products.
            </p>
            <div className="mt-10">
              <Link
                to="/shop"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-[#3D2C22] bg-[#3D2C22] px-8 py-3.5 text-base font-medium text-white hover:bg-[#2A1E17] hover:border-[#2A1E17] transition-all duration-200 active:scale-[0.985] shadow-md"
              >
                Visit the store
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-lg"
          >
            <img
              alt="The Global to Local team in the Fontainhas store"
              src="/images/site/team.png"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* 2. SOCIAL VENTURE GENESIS */}
      <section className="pt-6 pb-6 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-10 bg-ground text-content border-t border-border/40">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          {/* Heading - strictly in one row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="font-display text-2xl sm:text-3xl md:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-semibold leading-tight text-content tracking-tight md:whitespace-nowrap">
              Conceptualised during the pandemic, as a social venture
            </h2>
          </motion.div>

          {/* Video on Left, Story on Right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center"
          >
            {/* Left: Video */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-ink-deep shadow-lg group">
              {!videoError ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    loop
                    muted={isMuted}
                    controls
                    onError={() => setVideoError(true)}
                    className="h-full w-full object-cover"
                    preload="auto"
                  >
                    <source src="/videos/our-story.mp4" type="video/mp4" />
                  </video>
                  {/* Quick sound toggle badge */}
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        const nextMuted = !isMuted;
                        videoRef.current.muted = nextMuted;
                        setIsMuted(nextMuted);
                      }
                    }}
                    className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition-all cursor-pointer shadow-md select-none"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-white" />
                        <span>Unmute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                        <span>Mute</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <iframe
                  src="https://drive.google.com/file/d/1iAKFzXKggu2FCXk5zYDbGId4P_bIFKvz/preview?autoplay=1"
                  title="Global to Local Story Video"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Right: Story Text */}
            <div className="flex flex-col justify-center space-y-6 text-base sm:text-lg lg:text-[1.05rem] text-content-muted leading-relaxed">
              <p>
                The brain child of Goan entrepreneur Asha Arondekar to support the local women of this tropical little state. Conceptualised during the pandemic as a sole social venture to support women and promote the forgotten essence of our serene state.
              </p>
              <p>
                Since its inception five years ago, we have gone on to make{' '}
                <strong className="font-semibold text-content">100+ Goan women financially independent</strong>{' '}
                and creative while also assisting them in upgrading their skills to make them more confident, competent, and self sufficient individuals.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. WHERE IT ALL COMES FROM */}
      <section className="relative pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10 overflow-hidden bg-ground border-t border-border/40">
        <div className="mx-auto w-full max-w-shell px-5 sm:px-8 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.04] tracking-[-0.03em] text-content">
              One small state, one long coast
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
              Goa is not just about kokum, cashew and fish just walk into the store and learn more.
            </p>
          </motion.div>
        </div>

        {/* Ambient Coast Motifs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-content opacity-[0.06]">
          <span className="absolute left-[8%] bottom-[12%] block w-20 lg:w-28 rotate-[-10deg]">
            <TropicalSunIcon className="h-auto w-full" />
          </span>
          <span className="absolute right-[8%] top-[16%] block w-24 lg:w-32 rotate-[12deg]">
            <PalmLeafIcon className="h-auto w-full" />
          </span>
          <span className="absolute right-[24%] bottom-[10%] block w-20 lg:w-28 rotate-[-4deg]">
            <CoastalWaveIcon className="h-auto w-full" />
          </span>
        </div>
      </section>

      {/* 4. WHAT TWO YEARS OF BUYING LOCAL ADDS UP TO (STATS) */}
      <section className="relative isolate py-8 sm:py-12 lg:py-14 mx-[clamp(12px,2.5vw,32px)] my-2 sm:my-3 overflow-clip rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
        {/* Floating Goan motifs */}
        <ShellDrift tone="dark" />

        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl font-semibold text-content-ondark"
          >
            What five years of buying local adds up to
          </motion.h2>

          <div className="mt-12 lg:mt-16">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="border-t border-white/20 pt-6"
                >
                  <p className="font-display text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight text-content-ondark">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-content-ondark-muted">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. A MUST VISIT IN THE HEART OF PANAJI (GALLERY) */}
      <section className="py-12 sm:py-16 lg:py-20 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-content">
                A must visit in the heart of the capital, Panaji
              </h2>
              <p className="mt-5 text-base sm:text-lg text-content-muted leading-relaxed">
                We house everything from art and handicraft, to spices and grains, to wellness products, to bakery products and delectable desserts to name a few.
              </p>
              <p className="mt-3 text-base sm:text-lg text-content-muted leading-relaxed">
                We at Global to Local like to take things the extra mile, an experience is what it’s called by all that visit us with our staff educating you on the uniqueness, creativity, and process that goes into making Goa so culturally enriched.
              </p>
            </motion.div>

            {/* Right: 2-Photo Staggered Gallery */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface shadow-md group"
              >
                <img
                  src="/images/site/store-visitors-women-cropped.jpg"
                  alt="Visitors and shoppers exploring Global to Local store in Fontainhas"
                  className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-8 sm:mt-10 aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface shadow-md group"
              >
                <img
                  src="/images/site/store-team-men-cropped.jpg"
                  alt="Our team and guests inside Global to Local Fontainhas"
                  className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER ASHA ARONDEKAR & SOCIAL VENTURE PILLARS */}
      <section className="py-16 sm:py-24 lg:py-28 mx-[clamp(12px,2.5vw,32px)] my-4 overflow-clip rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Founder Portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
            >
              <img
                alt="Asha Arondekar, founder of Global to Local"
                src="/images/founder-asha-arondekar.jpg"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
            </motion.div>

            {/* Founder Story & 4 Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content-ondark leading-tight">
                A supermarket built as a social venture
              </h2>
              <p className="mt-4 max-w-xl text-base sm:text-lg text-content-ondark-muted leading-relaxed">
                Founded by Asha Arondekar to support local women and keep Goan making in the state.
              </p>

              <div className="mt-10 space-y-7">
                {pillars.map((pillar, idx) => (
                  <motion.div
                    key={pillar.num}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex gap-5 border-t border-white/15 pt-5"
                  >
                    <span className="font-mono text-base font-bold tabular-nums text-[#F0B832] drop-shadow-xs shrink-0 pt-0.5">
                      {pillar.num}
                    </span>
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-semibold text-content-ondark">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-content-ondark-muted">
                        {pillar.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. NOSTALGIA, BROUGHT TO YOUR DOORSTEP */}
      <section className="py-16 sm:py-24 lg:py-28 mx-[clamp(12px,2.5vw,32px)] my-4 overflow-clip rounded-2xl bg-surface-muted text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content">
              Nostalgia, brought to your doorstep
            </h2>
            <p className="mt-6 text-base sm:text-lg text-content-muted leading-relaxed">
              Visiting Goa and want to take some of its flavour back home with you? We are not just a must visit for the locals to tick off their monthly stocks, but for every tourist of Goa who get to take back home a little bit of Goa in their backpacks.
            </p>
            <p className="mt-5 text-base sm:text-lg text-content-muted leading-relaxed">
              Like something you bought and reminiscing your good ol’ days in Goa? Not a worry, we also courier across state and country so you can now have nostalgia brought to your doorstep no matter where you are.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 8. BOTTOM STORE BANNER */}
      <StoreBanner />
    </main>
  );
}
