import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Check, ShieldCheck, Truck, MapPin, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../lib/data';
import { useProductDetail, useCategories } from '../lib/catalogue-hooks';
import { useCartStore } from '../lib/cart-store';
import { useFlyToCart } from '../components/cart/FlyToCart';
import ProductCard from '../components/product/ProductCard';
import NotFoundPage from './NotFoundPage';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProductDetail(slug);
  const { data: categories = [] } = useCategories();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const inCartQty = useCartStore(state => {
    const item = state.items.find(i => i.product.id === product?.id || i.product.slug === product?.slug);
    return item ? item.qty : 0;
  });
  const flyToCart = useFlyToCart();

  if (isLoading) {
    return (
      <main id="main-content" className="pt-24 sm:pt-28 pb-16 sm:pb-20 bg-ground min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-palm border-t-transparent mb-3" />
          <p className="text-xs font-semibold text-content-muted">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (!product || product.is_active === false || product.status === 'Hidden' || product.status === 'Draft') {
    return <NotFoundPage />;
  }

  const category = product.category || categories.find(c => c.slug === product.categorySlug);
  const images = product.gallery && product.gallery.length > 0 ? product.gallery : [product.imageSrc];
  const relatedProducts = (product.related_products || []).filter(
    (p) => p && p.is_active !== false && p.status !== 'Hidden' && p.status !== 'Draft'
  );

  const categoryMakerMap = {
    kunbi: 'Kunbi weavers, Goa',
    masala: 'Self-help group kitchens, Goa',
    'papads-pickles': 'Self-help group kitchens, Goa',
    'papads-and-pickles': 'Self-help group kitchens, Goa',
    'chutneys-and-spreads': 'Self-help group kitchens, Goa',
    'chutneys-spreads': 'Self-help group kitchens, Goa',
    'hand-crafted': 'Goan makers',
    'sustainable-products': 'Goan makers',
    wellness: 'Goan makers',
    sweet: 'Traditional Goan confectioners',
    farsaan: 'Goan bakers & snack makers',
    seafood: 'Coastal Goan fisherfolk collectives',
    'oils-and-vinegars': 'Goan cold-press mills & distilleries',
    'oils-vinegars': 'Goan cold-press mills & distilleries',
    grains: 'Heritage Goan paddy farmers',
    spices: 'Goan spice estates & growers',
  };

  const madeByText =
    product.made_by ||
    product.madeBy ||
    (product.maker && product.maker.name) ||
    (product.slug && product.slug.startsWith('mitti-') ? 'Mitti potters, Goa' : null) ||
    categoryMakerMap[product.categorySlug] ||
    categoryMakerMap[category?.slug] ||
    'Goan makers';

  const handleAddToCart = (e) => {
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      flyToCart({
        startRect: rect,
        imageSrc: images[activeImage] || product.imageSrc,
      });
    }
    addItem(product, qty);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <main id="main-content" className="pt-24 sm:pt-28 pb-16 sm:pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-content-muted mb-5 sm:mb-6">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-accent transition-colors">Shop</Link>
          <span>/</span>
          {category && (
            <>
              <Link to={`/product-category/${category.slug}`} className="hover:text-accent transition-colors">
                {category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-content font-semibold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
          {/* Left: Gallery (Height matched with product info) */}
          <div className="lg:col-span-6 w-full space-y-3">
            <div className="relative aspect-square max-h-[420px] max-w-[420px] w-full overflow-hidden rounded-2xl border border-border/40 bg-surface shadow-xs">
              <img
                src={images[activeImage] || product.imageSrc}
                alt={product.imageAlt || product.name}
                className="h-full w-full object-cover object-center"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-18 w-18 overflow-hidden rounded-xl border-2 transition-all shadow-xs shrink-0 cursor-pointer ${
                      activeImage === idx ? 'border-accent ring-2 ring-accent/20' : 'border-border/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Purchase Controls (Aligned to top, filling right column) */}
          <div className="lg:col-span-6 flex flex-col justify-start w-full">
            {/* Category Tag & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link
                  to={`/product-category/${category.slug}`}
                  className="rounded-full bg-surface-muted/90 border border-border/50 px-3 py-1 font-sans text-xs font-semibold text-content hover:border-accent hover:text-accent transition-colors"
                >
                  {category.name}
                </Link>
              )}
              {(product.bestSeller || product.is_featured) && (
                <span className="rounded-full bg-[#faeedd] border border-[#d97757]/30 px-3 py-1 text-xs font-semibold text-[#b85433]">
                  Best seller
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-content leading-tight">
              {product.name}
            </h1>

            {/* Price & Unit */}
            <div className="mt-3.5 flex items-baseline gap-3">
              <span className="font-sans text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-content">
                {formatPrice(product.price)}
              </span>
              {(product.weight || product.unit_label) && (
                <span className="text-sm font-medium text-content-muted">
                  {product.weight || product.unit_label}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-border/30 pt-6">
              <p className="text-base sm:text-[1.0625rem] text-content-muted leading-relaxed whitespace-pre-line">
                {product.description || product.shortDescription || 'Authentic Goan specialty product prepared following age-old traditional recipes and methods.'}
              </p>
            </div>

            {/* Made by Callout with terracotta accent line (Matches Image 1) */}
            {madeByText && (
              <div className="mt-4 flex items-center border-l-2 border-[#d97757]/60 pl-3 py-0.5">
                <span className="text-sm text-content-muted">Made by&nbsp;</span>
                <span className="text-sm font-semibold text-content">{madeByText}</span>
              </div>
            )}

            {/* Availability Status */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2 text-palm">
                <Check className="w-4 h-4 text-palm shrink-0 stroke-[2.5]" />
                <span>In stock and ready to dispatch from Fontainhas</span>
              </div>
              {inCartQty > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-palm/15 border border-palm/25 text-palm px-3 py-1 text-xs font-bold">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{inCartQty} currently in your bag</span>
                </span>
              )}
            </div>

            {/* Stepper and Add To Bag Button */}
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {/* Stepper */}
              <div className="flex h-12 items-center justify-between rounded-pill border border-border bg-surface px-4 sm:w-36 shadow-xs">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-1 text-content hover:text-accent transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-sans text-sm font-bold text-content">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(20, qty + 1))}
                  disabled={qty >= 20}
                  className="p-1 text-content hover:text-accent disabled:opacity-30 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.inStock === false}
                className={`flex-1 flex h-12 items-center justify-center gap-2 rounded-pill px-8 text-sm sm:text-base font-bold text-white disabled:opacity-40 transition-all shadow-md hover:shadow-lg cursor-pointer ${
                  isAdded
                    ? 'bg-palm hover:bg-palm scale-[1.02]'
                    : 'bg-accent hover:bg-accent-hover'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added {qty > 1 ? `${qty} items` : ''} to Bag!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="font-sans font-bold tabular-nums">Add {qty > 1 ? `${qty} items` : ''} to Bag · {formatPrice(product.price * qty)}</span>
                  </>
                )}
              </button>
            </div>

            {/* Reassurance Badges */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/30 pt-6 text-xs text-content-muted">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>100% Made in Goa</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent shrink-0" />
                <span>Ships Pan-India (24–48h)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>Fresh Batch Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Shelf */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-border/40 pt-16">
            <h2 className="font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
              More from the {category?.name} Shelf
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
