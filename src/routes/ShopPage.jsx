import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCategories, useAllProducts, ProductGridSkeleton } from '../lib/catalogue-hooks';
import { categories as fallbackCategories } from '../lib/data';
import ProductCard from '../components/product/ProductCard';
import ShellShelf from '../components/home/ShellShelf';
import StoreBanner from '../components/home/StoreBanner';
import ShellDrift from '../components/common/ShellDrift';

export default function ShopPage() {
  const { data: categories = [], isLoading: isCategoriesLoading, isError: isCategoriesError, refetch: refetchCategories } = useCategories();
  const { data: products = [], isLoading: isProductsLoading, isError: isProductsError, refetch: refetchProducts } = useAllProducts();
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Selected category object
  const selectedCategoryObj = useMemo(() => {
    if (currentCategory === 'all') return null;
    return categories.find((c) => c.slug === currentCategory);
  }, [categories, currentCategory]);

  const getCategoryCover = (cat) => {
    if (cat.imageSrc) return cat.imageSrc;
    const fb = fallbackCategories.find((c) => c.slug === cat.slug);
    return fb?.imageSrc || '/images/site/storefront-hero.jpg';
  };

  const getCategoryBlurb = (cat) => {
    return cat.blurb || cat.description || fallbackCategories.find((c) => c.slug === cat.slug)?.blurb || '';
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

  const isBrowsingAllShelves = currentCategory === 'all' && currentSearch.trim() === '';

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
                Everything Goan
              </h1>
              <p className="mt-4 text-sm sm:text-base lg:text-lg text-content-ondark-muted leading-relaxed max-w-2xl">
                Every shelf is stocked from the different parts of the state.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. THE COMPLETE GOAN CATALOGUE (13 SHELVES OR SHELF PRODUCTS) */}
      <section id="catalogue" className="py-12 sm:py-16 lg:py-20 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
                {isBrowsingAllShelves
                  ? 'The 13 Goan Shelves'
                  : selectedCategoryObj
                  ? selectedCategoryObj.name
                  : 'Search Results'}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed">
                {isBrowsingAllShelves
                  ? 'Explore our 13 curated shelves from across the state. Click "Show More" on any shelf to view all its authentic local products.'
                  : selectedCategoryObj
                  ? `Showing all ${filteredProducts.length} authentic products in this shelf.`
                  : `Showing ${filteredProducts.length} products matching "${currentSearch}".`}
              </p>
            </div>

            {!isBrowsingAllShelves && (
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border/80 bg-surface px-5 py-2.5 text-xs sm:text-sm font-semibold text-content hover:bg-surface-muted transition-colors shadow-xs self-start md:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All 13 Shelves</span>
              </button>
            )}
          </div>

          {/* Filter & Controls Bar - Only visible when inside a specific shelf or searching */}
          {!isBrowsingAllShelves && (
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 sm:max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-content-muted" />
                <input
                  type="text"
                  value={currentSearch}
                  onChange={(e) => updateFilters('q', e.target.value)}
                  placeholder="Search in this shelf..."
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
            </div>
          )}

          {/* Main Content Area */}
          {isProductsLoading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : isProductsError && products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 rounded-2xl border border-rose-200 bg-rose-50/60 p-12 text-center max-w-lg mx-auto shadow-xs"
            >
              <h3 className="font-display text-xl font-semibold text-content">Could not load catalogue</h3>
              <p className="mt-2 text-sm text-content-muted leading-relaxed">
                Could not connect to the store catalogue. Please retry.
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
          ) : isBrowsingAllShelves ? (
            /* 13 Shelves Cards View */
            <div className="mt-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                {categories.map((cat, idx) => {
                  const count = products.filter((p) => {
                    const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
                    return pCat === cat.slug;
                  }).length;
                  const cover = getCategoryCover(cat);
                  const blurb = getCategoryBlurb(cat);

                  return (
                    <motion.div
                      key={cat.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.4) }}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Shelf Image Container */}
                      <div
                        onClick={() => updateFilters('category', cat.slug)}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted cursor-pointer"
                      >
                        <img
                          src={cover}
                          alt={cat.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        {/* Product Count Badge */}
                        <span className="absolute top-3 right-3 rounded-pill bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-xs">
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>

                        {/* Shelf Title on Image */}
                        <div className="absolute bottom-3.5 left-4 right-4">
                          <h3 className="font-display text-xl sm:text-2xl font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                            {cat.name}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex flex-1 flex-col justify-between">
                        <p className="text-xs sm:text-sm text-content-muted line-clamp-2 leading-relaxed">
                          {blurb || `Authentic Goan ${cat.name.toLowerCase()} sourced directly from local producers.`}
                        </p>

                        {/* Button Under Every Shelf: Show More (Dark always - matches Image 2) */}
                        <button
                          type="button"
                          onClick={() => updateFilters('category', cat.slug)}
                          className="mt-5 w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill bg-[#3D2C22] py-2.5 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-[#2A1E17] transition-all duration-200 shadow-xs active:scale-[0.98]"
                        >
                          <span>Show More</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* No Products Found */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 rounded-2xl border border-border/40 bg-surface p-12 text-center max-w-lg mx-auto shadow-xs"
            >
              <h3 className="font-display text-xl font-semibold text-content">No products found</h3>
              <p className="mt-2 text-sm text-content-muted leading-relaxed">
                No products match the selected filters.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 inline-flex items-center rounded-pill bg-palm px-6 py-2.5 text-xs font-semibold text-white hover:bg-palm-shade transition-colors shadow-sm cursor-pointer"
              >
                Back to All 13 Shelves
              </button>
            </motion.div>
          ) : (
            /* Selected Shelf / Category Full Products Grid */
            <div>
              <div className="mt-6 mb-4 flex items-center justify-between text-xs font-medium text-content-muted">
                <span>Showing all {filteredProducts.length} products</span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 8} />
                ))}
              </div>
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
