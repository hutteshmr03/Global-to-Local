import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useReviews } from '../../lib/catalogue-hooks';

const fallbackReviews = [
  {
    author: 'Gifty Abraham',
    role: null,
    rating: 5,
    quote:
      'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
  },
  {
    author: 'Stedwick Fernandes',
    role: null,
    rating: 5,
    quote:
      'The store had Kokani music playing. The light shades were so much like the ones in my great granny\'s house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.',
  },
  {
    author: 'Swapna Pujari',
    role: 'SilhouetteIndia',
    rating: 5,
    quote:
      'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
  },
];

export default function ReviewCarousel() {
  const { data: reviews = fallbackReviews } = useReviews("Visitors' Book", fallbackReviews);
  return (
    <section className="py-20 sm:py-24 lg:py-28 mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
      <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
            What people say after they visit
          </h2>
          <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
            Reviews left by customers of the Fontainhas store.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="mt-14 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, idx) => {
            const stars = Math.max(1, Math.min(5, Number(review.stars || review.rating || 5)));
            const quote = review.quote || review.description || '';
            const author = review.author || review.author_name || review.name || 'Store Customer';
            const role = review.role || review.author_location || review.location || '';
            return (
              <motion.div
                key={review.id || review.author || idx}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (idx % 6) * 0.1 }}
                className="h-full"
              >
                <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-surface p-7 sm:p-8 shadow-xs transition-all duration-300 hover:border-accent/40 hover:shadow-md hover:-translate-y-1">
                  <div>
                    {/* Stars */}
                    <div className="flex gap-1 text-accent" role="img" aria-label={`${stars} out of 5 stars`}>
                      {[...Array(stars)].map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 fill-current" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="mt-5 text-[0.9375rem] leading-relaxed text-content-muted">
                      “{quote}”
                    </blockquote>
                  </div>

                  {/* Author Info */}
                  <figcaption className="mt-6 border-t border-border/40 pt-5">
                    <span className="block font-display text-base font-semibold text-content">
                      {author}
                    </span>
                    {role && (
                      <span className="mt-0.5 block text-xs text-content-subtle">
                        {role}
                      </span>
                    )}
                  </figcaption>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
