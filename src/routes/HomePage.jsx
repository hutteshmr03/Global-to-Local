import React from 'react';
import HomeHero from '../components/home/HomeHero';
import FactsTicker from '../components/home/FactsTicker';
import FilmVideoDuo from '../components/home/FilmVideoDuo';
import FilmVideoBanner from '../components/home/FilmVideoBanner';
import ShelfRail from '../components/home/ShelfRail';
import MakerSteps from '../components/home/MakerSteps';
import ShellShelf from '../components/home/ShellShelf';
import ReviewCarousel from '../components/home/ReviewCarousel';
import StoreBanner from '../components/home/StoreBanner';

export default function HomePage() {
  return (
    <main id="main" className="min-w-0">
      {/* 1. Hero with Video Background & Scrim */}
      <HomeHero />

      {/* 2. Marquee Ticker & "Why it is called Global to Local" Word Reveal */}
      <FactsTicker />

      {/* 3. Combined Single Row: Grains + Kunbi Video Banners */}
      <FilmVideoDuo
        banners={[
          {
            title: 'Red rice in a cane soop',
            description: 'Farm-grown grains from the state — the first thing a Goan kitchen reaches for.',
            videoSrc: '/videos/rice.mp4',
            poster: '/videos/rice-poster.jpg',
            alt: 'Red rice in a cane soop',
            ctaText: 'Shop grains',
            ctaLink: '/product-category/grains',
          },
          {
            title: 'The Kunbi check',
            description: 'Goa’s oldest weave, still on the loom. Shawls, sarees, and cotton for the house.',
            imageSrc: '/images/site/kunbi-red-check.jpg',
            poster: '/images/site/kunbi-red-check.jpg',
            alt: 'Traditional Goan Kunbi weave red and white cotton saree',
            ctaText: 'Shop Kunbi',
            ctaLink: '/product-category/kunbi',
          },
        ]}
      />

      {/* 4. Thirteen shelves, all Goan horizontal rail */}
      <ShelfRail />

      {/* 5. Combined Single Row: Spices (Kokum) + Sustainable (Mitti) Video Banners */}
      <FilmVideoDuo
        banners={[
          {
            title: 'Kokum on cotton',
            description: 'Sola, spices, and the sour-sweet that belongs to this coast.',
            videoSrc: '/videos/kokum.mp4',
            poster: '/videos/kokum-poster.jpg',
            alt: 'Kokum sola on cotton',
            ctaText: 'Shop spices',
            ctaLink: '/product-category/spices',
          },
          {
            title: 'A pot from the earth',
            description: 'Mitti ware and things made to last, with less packaging and a lighter hand.',
            videoSrc: '/videos/mitti.mp4',
            poster: '/videos/mitti-poster.jpg',
            alt: 'A mitti pot on cotton',
            ctaText: 'Shop mitti',
            ctaLink: '/product-category/sustainable-products',
          },
        ]}
      />

      {/* 8. Four Steps Maker Story */}
      <MakerSteps />

      {/* 9. Video Banner: Masala Makers */}
      <FilmVideoBanner
        title="Hands that grind the masala"
        description="Founded by Asha Arondekar and made by women of Goa."
        videoSrc="/videos/maker.mp4"
        poster="/videos/maker-poster.jpg"
        alt="Hands grinding red masala"
        ctaText="Meet the makers"
        ctaLink="/our-story"
        frondPosition="bottom-right"
      />

      {/* 10. Picked Off The Shore - Shell Carousel */}
      <ShellShelf />

      {/* 11. Combined Single Row: Hampers + Latin Quarters Store Video Banners */}
      <FilmVideoDuo
        banners={[
          {
            title: 'Customize gift hampers',
            description: (
              <>
                <span className="block">Gift hampers are packed in Goa, for addresses in Goa.</span>
                <span className="block">Write to us or ask at the Fontainhas store — this site cannot take a hamper order yet.</span>
              </>
            ),
            videoSrc: '/videos/hamper.mp4',
            poster: '/videos/hamper-poster.jpg',
            alt: 'Packing a cane basket',
            ctaText: 'Ask about a hamper',
            ctaLink: '/contact',
          },
          {
            title: 'Local patios, Konkani on the speakers',
            description: (
              <>
                <span className="block">A quaint store in the Latin Quarters of Goa, Fontainhas.</span>
                <span className="block">Open all through the week, 10 AM to 9 PM.</span>
              </>
            ),
            videoSrc: '/videos/patio.mp4',
            poster: '/videos/patio-poster.jpg',
            alt: 'Inside the Fontainhas store',
            ctaText: 'Visit Fontainhas',
            ctaLink: '/contact',
          },
        ]}
      />

      {/* 13. Visitor Reviews */}
      <ReviewCarousel />

      {/* 14. Take a Little Bit of Goa Home Banner */}
      <StoreBanner />
    </main>
  );
}
