import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../lib/data';
import { useCartStore } from '../../lib/cart-store';
import { useFlyToCart } from '../cart/FlyToCart';

export default function ProductCard({ product, priority = false }) {
  const isHidden = !product || product.is_active === false || product.status === 'Hidden' || product.status === 'Draft';
  const addItem = useCartStore(state => state.addItem);
  const updateQty = useCartStore(state => state.updateQty);
  const removeItem = useCartStore(state => state.removeItem);
  const inCartQty = useCartStore(state => {
    if (!product?.id) return 0;
    const item = state.items.find(i => i.product.id === product.id);
    return item ? item.qty : 0;
  });
  const flyToCart = useFlyToCart();
  const [imgSrc, setImgSrc] = useState(null);

  if (isHidden) {
    return null;
  }

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger smooth flying particle
    const rect = e.currentTarget.getBoundingClientRect();
    flyToCart({
      startRect: rect,
      imageSrc: product.imageSrc || product.image_url || '/images/catalog/goan-themed-blue-mug.jpg',
    });

    // Add item to cart store directly (immediately turns inCartQty to 1)
    addItem(product, 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty >= 20) return;

    const rect = e.currentTarget.getBoundingClientRect();
    flyToCart({
      startRect: rect,
      imageSrc: product.imageSrc || product.image_url || '/images/catalog/goan-themed-blue-mug.jpg',
    });
    updateQty(product.id, inCartQty + 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty <= 1) {
      removeItem(product.id);
    } else {
      updateQty(product.id, inCartQty - 1);
    }
  };

  const displayPricePaise = product.price ?? product.price_paise ?? 0;
  const initialImage = (product.imageSrc && !product.imageSrc.endsWith('goan-themed-blue-mug.jpg'))
    ? product.imageSrc
    : (product.slug ? `/images/catalog/${product.slug}.jpg` : (product.image_url || '/images/catalog/goan-themed-blue-mug.jpg'));
  const displayImage = imgSrc || initialImage;
  const displayWeight = product.weight || product.unit_label || 'piece';
  const displayDesc = product.shortDescription || product.short_description || product.description || 'Authentic Goan specialty made with local ingredients.';

  const isSoldOut =
    product.inStock === false ||
    product.availability === 'out_of_stock' ||
    (product.available_quantity !== undefined && product.available_quantity <= 0) ||
    (product.stock_qty !== undefined && product.stock_qty <= 0);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-surface border border-border/40 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link to={`/product/${product.slug}`} className="flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-muted">
          <img
            src={displayImage}
            alt={product.imageAlt || product.name}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => {
              if (displayImage !== '/images/catalog/goan-themed-blue-mug.jpg') {
                setImgSrc('/images/catalog/goan-themed-blue-mug.jpg');
              }
            }}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          {isSoldOut && (
            <span className="absolute top-2 right-2 rounded-full bg-rose-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 flex flex-col">
          <h3 className="font-display text-sm sm:text-base font-semibold text-content group-hover:text-accent line-clamp-1 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-content-muted line-clamp-2 leading-relaxed min-h-[2.25rem]">
            {displayDesc}
          </p>
          
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="font-sans text-base font-bold tabular-nums tracking-tight text-content">
              {formatPrice(displayPricePaise)}
            </span>
            <span className="text-xs text-content-subtle">
              / {displayWeight}
            </span>
          </div>
        </div>
      </Link>

      {/* Quick Add / Stepper Button */}
      {inCartQty > 0 ? (
        <div className="mt-3 flex w-full items-center justify-between rounded-pill bg-[#3D2C22] text-white border border-[#3D2C22] px-2 py-1.5 text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={handleDecrement}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer active:scale-90"
            aria-label={`Decrease ${product.name} quantity`}
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <span className="font-sans text-xs font-bold px-3 select-none text-white">
            {inCartQty}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={inCartQty >= 20}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer disabled:opacity-40 active:scale-90"
            aria-label={`Increase ${product.name} quantity`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isSoldOut}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-pill py-2.5 text-xs font-semibold transition-all shadow-xs ${
            isSoldOut
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300 font-bold uppercase tracking-wider shadow-none select-none'
              : 'bg-[#3D2C22] text-white hover:bg-[#2A1E17] cursor-pointer active:scale-[0.98]'
          }`}
          aria-label={isSoldOut ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
        >
          {isSoldOut ? (
            <span>OUT OF STOCK</span>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
