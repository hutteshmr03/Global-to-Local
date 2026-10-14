import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCategories, useAllProducts, ProductGridSkeleton } from '../lib/catalogue-hooks';
import ProductCard from '../components/product/ProductCard';
import ShellShelf from '../components/home/ShellShelf';
import StoreBanner from '../components/home/StoreBanner';
import ShellDrift from '../components/common/ShellDrift';
import { ShellCockleIcon } from '../components/common/Icons';

export default function ShopPage() {
  const { data: categories = [], isLoading: isCategoriesLoading, isError: isCategoriesError, refetch: refetchCategories } = useCategories();
  const { data: products = [], isLoading: isProductsLoading, isError: isProductsError, refetch: refetchProducts } = useAllProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const shelfRailRef = useRef(null);
  const [railProgress, setRailProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'featured';
  const inStockOnly = searchParams.get('in_stock') === 'true';

  const updateFilters = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== false) {
      next.set(key, String(value));
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Track horizontal scrolling of the 13 shelves rail
  const updateRailScrollState = () => {
    const el = shelfRailRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setRailProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const current = el.scrollLeft;
    const pct = Math.min(100, Math.max(0, (current / maxScroll) * 100));
    setRailProgress(pct);
    setCanScrollLeft(current > 8);
    setCanScrollRight(current < maxScroll - 8);
  };

  useEffect(() => {
    const el = shelfRailRef.current;
    if (!el) return;
    updateRailScrollState();
    el.addEventListener('scroll', updateRailScrollState, { passive: true });
    window.addEventListener('resize', updateRailScrollState);
    return () => {
      el.removeEventListener('scroll', updateRailScrollState);
      window.removeEventListener('resize', updateRailScrollState);
    };
  }, []);

  const scrollRail = (direction) => {
    const el = shelfRailRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.snap-start');
    if (!cards.length) {
      const cardWidth = el.clientWidth * 0.75;
      const delta = direction === 'left' ? -cardWidth : cardWidth;
      el.scrollBy({ left: delta, behavior: 'smooth' });
      return;
    }

    const currentLeft = el.scrollLeft;
    let targetLeft = currentLeft;

    if (direction === 'right') {
      for (let i = 0; i < cards.length; i++) {
        const cardOffset = cards[i].offsetLeft - el.offsetLeft;
        if (cardOffset > currentLeft + 15) {
          targetLeft = cardOffset;
          break;
        }
      }
      if (targetLeft === currentLeft) {
        targetLeft = el.scrollWidth - el.clientWidth;
      }
    } else {
      for (let i = cards.length - 1; i >= 0; i--) {
        const cardOffset = cards[i].offsetLeft - el.offsetLeft;
        if (cardOffset < currentLeft - 15) {
          targetLeft = cardOffset;
          break;
        }
      }
      if (targetLeft === currentLeft) {
        targetLeft = 0;
      }
    }

    el.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p || p.is_active === false || p.status === 'Hidden' || p.status === 'Draft') {
          return false;
        }
        const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
        if (currentCategory !== 'all' && pCat !== currentCategory) {
          return false;
        }
        if (currentSearch) {
          const q = currentSearch.toLowerCase();
          const matchesName = (p.name || '').toLowerCase().includes(q);
          const matchesDesc = (p.description || p.shortDescription || p.short_description || '').toLowerCase().includes(q);
          const matchesCat = (pCat || '').toLowerCase().includes(q);
          if (!matchesName && !matchesDesc && !matchesCat) return false;
        }
        if (inStockOnly && (p.inStock === false || p.availability === 'out_of_stock')) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = a.price ?? a.price_paise ?? 0;
        const priceB = b.price ?? b.price_paise ?? 0;
        if (currentSort === 'price_asc') return priceA - priceB;
        if (currentSort === 'price_desc') return priceB - priceA;
        if (currentSort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        return 0; // featured
      });
  }, [products, currentCategory, currentSearch, currentSort, inStockOnly]);

  return (
    <main id="main" className="min-w-0 bg-ground pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-1">
        <section className="relative isolate overflow-hidden rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
          <img
            src="/images/site/hamper-patio.jpg"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-30 brightness-[0.6] saturate-[1.2]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

          {/* Floating shell motifs */}
          <ShellDrift tone="dark" />

          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-12 sm:py-16 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.08] text-content-ondark [text-shadow:0_1px_18px_rgba(18,38,43,0.45)]">
                Everything on our shelves, made in Goa
              </h1>
              <p className="mt-4 text-sm sm:text-base lg:text-lg text-content-ondark-muted leading-relaxed max-w-2xl">
                Local Goan farm-grown vegetables, fruits, cashews, kokum, eggs, milk, sweets, savories, authentic Goan masalas, pastes, powders, and more.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. SHELF BY SHELF HORIZONTAL RAIL */}
      <section className="py-16 sm:py-20 lg:py-24 mx-[clamp(12px,2.5vw,32px)] my-3 overflow-clip rounded-2xl bg-surface-muted text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">
              <ShellCockleIcon className="h-[18px] w-[18px]" />
              <span>Shelf by shelf</span>
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content">
              Thirteen shelves, all Goan
            </h2>
            <p className="mt-4 max-w-[52ch] text-base sm:text-lg text-content-muted leading-relaxed">
              Every shelf is stocked from the state. Pick one, or filter the whole catalogue below.
            </p>
          </motion.div>
        </div>

        {/* 13 Category Cards Rail */}
        <div className="mt-10 lg:mt-12">
          <div className="relative">
            <div
              ref={shelfRailRef}
              onScroll={updateRailScrollState}
              role="region"
              aria-label="Product categories"
              tabIndex={0}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:gap-6 hide-scrollbar rail-gutter scroll-smooth"
            >
              {categories.map((cat) => {
                const count = products.filter((p) => {
                  const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
                  return pCat === cat.slug;
                }).length;
                const isCurrent = currentCategory === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    to={`/shop?category=${cat.slug}#catalogue`}
                    onClick={() => updateFilters('category', cat.slug)}
                    className="group w-[62vw] shrink-0 snap-start sm:w-[34vw] lg:w-[19rem]"
                  >
                    <div
                      className={`overflow-hidden rounded-2xl border transition-all duration-300 bg-surface shadow-xs hover:shadow-md ${
                        isCurrent
                          ? 'border-palm ring-2 ring-palm/20'
                          : 'border-border/60 hover:border-content-subtle'
                      }`}
                    >
                      <div className="relative overflow-hidden bg-surface-sunken aspect-video">
                        <img
                          alt={cat.imageAlt || cat.name}
                          src={cat.imageSrc}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-base sm:text-[1.0625rem] font-semibold transition-colors group-hover:text-accent text-content">
                            {cat.name}
                          </h3>
                          <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-content-subtle">
                            {count}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-content-muted">
                          {cat.blurb}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Scroll Navigation Controls */}
            <div className="mt-6 flex items-center gap-5 rail-gutter">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40" role="presentation">
                <div
                  className="h-full rounded-full bg-accent will-change-[width] transition-[width] duration-150 ease-out"
                  style={{ width: `${Math.max(8, railProgress)}%` }}
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={!canScrollLeft}
                  onClick={() => scrollRail('left')}
                  aria-label="Scroll shelf left"
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-surface shadow-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!canScrollRight}
                  onClick={() => scrollRail('right')}
                  aria-label="Scroll shelf right"
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-pill border border-border bg-surface text-content transition-colors duration-200 hover:border-content-subtle hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-surface shadow-xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE COMPLETE GOAN CATALOGUE (FILTERS & PRODUCT GRID) */}
      <section id="catalogue" className="py-16 sm:py-20 lg:py-24 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          {/* Header */}
          <div className="border-b border-border/40 pb-8">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
              Explore The Shelves
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
              The Complete Goan Catalogue
            </h2>
            <p className="mt-3 max-w-2xl text-base text-content-muted leading-relaxed">
              Explore 230 authentic Goan products across all 13 shelves, dispatched directly from Fontainhas, Panaji.
            </p>
          </div>

          {/* Filter & Controls Bar */}
          <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Shelf Category Horizontal Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button
                type="button"
                onClick={() => updateFilters('category', 'all')}
                className={`rounded-pill px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border shadow-xs cursor-pointer ${
                  currentCategory === 'all'
                    ? 'border-palm bg-palm text-white shadow-sm'
                    : 'border-border/60 bg-surface text-content hover:bg-surface-muted'
                }`}
              >
                All
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => {
                  const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
                  return pCat === cat.slug;
                }).length;
                const isSelected = currentCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => updateFilters('category', cat.slug)}
                    className={`rounded-pill px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border shadow-xs cursor-pointer ${
                      isSelected
                        ? 'border-palm bg-palm text-white shadow-sm'
                        : 'border-border/60 bg-surface text-content hover:bg-surface-muted'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search, In-Stock Checkbox, Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-content-muted" />
                <input
                  type="text"
                  value={currentSearch}
                  onChange={(e) => updateFilters('q', e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-pill border border-border/80 bg-surface py-2 pl-9 pr-8 text-xs font-medium text-content placeholder-content-subtle outline-none focus:border-palm shadow-xs"
                />
                {currentSearch && (
                  <button
                    type="button"
                    onClick={() => updateFilters('q', '')}
                    className="absolute right-3 top-2.5 text-content-subtle hover:text-content"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => updateFilters('in_stock', !inStockOnly)}
                className={`flex items-center gap-2 rounded-pill border px-4 py-2 text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  inStockOnly
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border/80 bg-surface text-content hover:bg-surface-muted'
                }`}
              >
                <div
                  className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                    inStockOnly ? 'border-accent bg-accent text-white' : 'border-border'
                  }`}
                >
                  {inStockOnly && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>In Stock</span>
              </button>

              {/* Sort Dropdown */}
              <select
                aria-label="Sort products"
                value={currentSort}
                onChange={(e) => updateFilters('sort', e.target.value)}
                className="rounded-pill border border-border/80 bg-surface py-2 px-4 text-xs font-semibold text-content outline-none cursor-pointer focus:border-palm shadow-xs"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Results Count & Filter Reset */}
          <div className="mt-6 flex items-center justify-between text-xs font-medium text-content-muted">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            {(currentCategory !== 'all' || currentSearch || inStockOnly || currentSort !== 'featured') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-accent hover:underline font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Products Grid */}
          {isProductsLoading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : isProductsError && products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 rounded-2xl border border-rose-200 bg-rose-50/60 p-12 text-center max-w-lg mx-auto shadow-xs"
            >
              <h3 className="font-display text-xl font-semibold text-content">Could not load products</h3>
              <p className="mt-2 text-sm text-content-muted leading-relaxed">
                Could not connect to the live store API. Please check that the backend is running and retry.
              </p>
              <button
                type="button"
                onClick={() => {
                  refetchProducts();
                  refetchCategories();
                }}
                className="mt-6 inline-flex items-center rounded-pill bg-palm px-6 py-2.5 text-xs font-semibold text-white hover:bg-palm-shade transition-colors shadow-sm cursor-pointer"
              >
                Retry
              </button>
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 rounded-2xl border border-border/40 bg-surface p-12 text-center max-w-lg mx-auto shadow-xs"
            >
              <h3 className="font-display text-xl font-semibold text-content">No products match your search</h3>
              <p className="mt-2 text-sm text-content-muted leading-relaxed">
                Try adjusting your search keywords, selecting another shelf category, or clearing active filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 inline-flex items-center rounded-pill bg-palm px-6 py-2.5 text-xs font-semibold text-white hover:bg-palm-shade transition-colors shadow-sm cursor-pointer"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. PICKED OFF THE SHORE (SHELL CRAFT SHELF) */}
      <ShellShelf />

      {/* 5. BOTTOM STORE BANNER */}
      <StoreBanner />
    </main>
  );
}
