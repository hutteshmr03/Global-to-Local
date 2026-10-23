import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Check, X, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useCategories, useAllProducts, ProductGridSkeleton } from '../lib/catalogue-hooks';
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

  const [expandedShelves, setExpandedShelves] = useState({});

  const toggleShelf = (slug) => {
    setExpandedShelves((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

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

  // Group products by category when viewing "all" without search query
  const categorizedShelves = useMemo(() => {
    if (currentCategory !== 'all' || currentSearch.trim() !== '') {
      return null;
    }

    return categories
      .map((cat) => {
        const catProducts = filteredProducts.filter((p) => {
          const pCat = p.categorySlug || p.category_slug || (p.category && p.category.slug);
          return pCat === cat.slug;
        });
        return {
          category: cat,
          products: catProducts,
        };
      })
      .filter((shelf) => shelf.products.length > 0);
  }, [categories, filteredProducts, currentCategory, currentSearch]);

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

      {/* 2. THE COMPLETE GOAN CATALOGUE (FILTERS & PRODUCT GRID) */}
      <section id="catalogue" className="py-16 sm:py-20 lg:py-24 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          {/* Header */}
          <div className="border-b border-border/40 pb-8">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-content">
              The Complete Goan Catalogue
            </h2>
            <p className="mt-3 text-base text-content-muted leading-relaxed whitespace-normal sm:whitespace-nowrap">
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
          ) : categorizedShelves ? (
            /* 13 Categorized Shelves View */
            <div className="mt-10 space-y-16">
              {categorizedShelves.map((shelf) => {
                const isExpanded = !!expandedShelves[shelf.category.slug];
                const visibleProducts = isExpanded ? shelf.products : shelf.products.slice(0, 4);
                const hasMore = shelf.products.length > 4;

                return (
                  <section
                    key={shelf.category.slug}
                    id={`shelf-${shelf.category.slug}`}
                    className="border-b border-border/30 pb-12 last:border-b-0 last:pb-0"
                  >
                    {/* Shelf Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/20 pb-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-content">
                            {shelf.category.name}
                          </h3>
                          <span className="rounded-pill bg-palm/10 px-3 py-0.5 text-xs font-semibold text-palm">
                            {shelf.products.length} {shelf.products.length === 1 ? 'product' : 'products'}
                          </span>
                        </div>
                        {shelf.category.blurb && (
                          <p className="mt-1.5 text-xs sm:text-sm text-content-muted max-w-2xl">
                            {shelf.category.blurb}
                          </p>
                        )}
                      </div>

                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => updateFilters('category', shelf.category.slug)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-palm hover:text-ink-deep transition-colors cursor-pointer self-start sm:self-auto"
                        >
                          <span>View full shelf ({shelf.products.length})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-6">
                      {visibleProducts.map((product, idx) => (
                        <ProductCard key={product.id} product={product} priority={idx < 4} />
                      ))}
                    </div>

                    {/* Show More / Show Less Button */}
                    {hasMore && (
                      <div className="mt-8 flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleShelf(shelf.category.slug)}
                          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-palm/40 bg-surface px-7 py-3 text-xs sm:text-sm font-semibold text-palm hover:bg-palm hover:border-palm hover:text-white transition-all duration-200 shadow-xs active:scale-[0.98]"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show Less</span>
                              <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <span>Show More ({shelf.products.length} {shelf.category.name})</span>
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            /* Single Category or Search Filtered Grid */
            <div>
              {selectedCategoryObj && (
                <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold text-content">
                      {selectedCategoryObj.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-content-muted">
                      Showing all {filteredProducts.length} products in this shelf
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateFilters('category', 'all')}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-border/80 bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>← Back to all shelves</span>
                  </button>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-6">
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
