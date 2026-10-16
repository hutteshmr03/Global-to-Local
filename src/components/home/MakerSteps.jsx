import React from 'react';
import { motion } from 'framer-motion';
import { ScallopTrimPattern } from '../common/Icons';

const steps = [
  {
    num: '01',
    title: 'It starts in her kitchen',
    body: 'A recipe from her own house — a masala, a pickle, a batch of papads — ground and mixed by hand, in quantities a kitchen can actually manage.',
    image: '/videos/maker-poster.jpg',
    alt: 'Hands grinding red masala on a stone',
  },
  {
    num: '02',
    title: 'Dried in the sun, cured slowly',
    body: 'Kokum sola on cotton, papads on the roof, sola in the shade. The coast does half the work and it will not be hurried.',
    image: '/videos/kokum-poster.jpg',
    alt: 'Kokum sola drying on cotton cloth',
  },
  {
    num: '03',
    title: 'Onto the shelf in Fontainhas',
    body: 'It reaches Tarcar Mansion and goes out on the shelf beside the rest — one shop, thirteen shelves, all of it from the state.',
    image: '/videos/patio-poster.jpg',
    alt: 'Inside the Global to Local store in Fontainhas',
  },
  {
    num: '04',
    title: 'Packed in cane, sent on',
    body: 'Wrapped and set into a cane basket by hand. Ask at the store or write to us — hampers are put together in Goa.',
    image: '/videos/hamper-poster.jpg',
    alt: 'Hands packing a cane basket',
  },
];

export default function MakerSteps() {
  return (
    <section className="relative mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
      {/* Main Container */}
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell py-20 sm:py-24 lg:py-28 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-left"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
            Her kitchen to your home
          </h2>
        </motion.div>

        {/* Zig-Zag Alternating Steps */}
        <div className="mt-12 sm:mt-16 lg:mt-20 space-y-20 sm:space-y-28 lg:space-y-36">
          {steps.map((step, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <div
                key={step.num}
                className={`grid grid-cols-1 lg:grid-cols-12 items-center gap-8 sm:gap-12 lg:gap-16 ${
                  isEven ? '' : 'lg:grid-flow-dense'
                }`}
              >
                {/* Image Column: Slides in from left if even, right if odd */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -48 : 48, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className={`lg:col-span-6 ${isEven ? '' : 'lg:col-start-7'}`}
                >
                  <div className="group relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-3xl border border-border/40 bg-surface shadow-md transition-all duration-500 hover:shadow-xl hover:border-accent/30">
                    <img
                      src={step.image}
                      alt={step.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Subtle Corner Step Pill */}
                    <div className="absolute top-4 left-4 rounded-full bg-ground/90 backdrop-blur-md px-3.5 py-1 text-xs font-display font-bold text-accent border border-border/30 shadow-xs">
                      Step {step.num}
                    </div>
                  </div>
                </motion.div>

                {/* Text Column: Slides in from right if even, left if odd */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 48 : -48, y: 20 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className={`lg:col-span-6 ${isEven ? '' : 'lg:col-start-1'}`}
                >
                  <div className="max-w-xl">
                    <div className="flex items-baseline gap-3.5">
                      <span className="font-display text-base sm:text-lg font-bold tabular-nums text-accent">
                        {step.num}
                      </span>
                      <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-content">
                        {step.title}
                      </h3>
                    </div>

                    <p className="mt-4 sm:mt-5 text-base sm:text-lg text-content-muted leading-relaxed">
                      {step.body}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent/80">
                      <span>Goan Craft & Heritage</span>
                      <span className="text-accent">✦</span>
                      <span>Handmade</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
