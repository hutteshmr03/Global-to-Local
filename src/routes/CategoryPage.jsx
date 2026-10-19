import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCategories, useCategoryProducts } from '../lib/catalogue-hooks';
import ProductCard from '../components/product/ProductCard';
import NotFoundPage from './NotFoundPage';

export default function CategoryPage() {
  const { slug } = useParams();
  const { data: categories = [] } = useCategories();
  const normalizeSlug = (s) => (s || '').replace(/-and-/g, '-');
  const category = categories.find((c) => c.slug === slug || normalizeSlug(c.slug) === normalizeSlug(slug));
  const { data: products = [] } = useCategoryProducts(category ? category.slug : slug);

  const activeProducts = React.useMemo(() => {
    return products.filter((p) => p && p.is_active !== false && p.status !== 'Hidden' && p.status !== 'Draft');
  }, [products]);

  if (!category) {
    return <NotFoundPage />;
  }

  return (
    <main id="main-content" className="pt-32 sm:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-shell px-5 sm:px-8 lg:px-12">
        {/* Back Link */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-content-muted hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Shelves</span>
        </Link>

        {/* Shelf Header Banner */}
        <div className="rounded-2xl border border-border/40 bg-surface p-8 sm:p-10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-content">
              {category.name}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-content-muted leading-relaxed">
              {category.blurb || `Authentic Goan ${category.name.toLowerCase()} sourced from local producers.`}
            </p>
            <p className="mt-4 text-xs font-semibold text-palm">
              Showing all {activeProducts.length} {activeProducts.length === 1 ? 'item' : 'items'} on this shelf
            </p>
          </div>

          {category.imageSrc && (
            <div className="relative aspect-4/3 w-full md:w-64 overflow-hidden rounded-xl bg-surface-muted shrink-0 border border-border/20 shadow-xs">
              <img
                src={category.imageSrc}
                alt={category.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 sm:gap-6">
          {activeProducts.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 8} />
          ))}
        </div>
      </div>
    </main>
  );
}
