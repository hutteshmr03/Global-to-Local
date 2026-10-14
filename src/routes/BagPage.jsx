import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { useAuthStore } from '../lib/auth-store';
import { formatPrice } from '../lib/data';

export default function BagPage() {
  const user = useAuthStore(state => state.user);
  const items = useCartStore(state => state.items);
  const updateQty = useCartStore(state => state.updateQty);
  const removeItem = useCartStore(state => state.removeItem);
  const subtotal = useCartStore(state => state.getSubtotalPaise());
  const cartError = useCartStore(state => state.cartError);
  const clearCartError = useCartStore(state => state.clearCartError);

  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-shell px-5 sm:px-8 lg:px-12">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-content-muted hover:text-accent mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-content">
          Shopping Bag ({items.reduce((s, i) => s + i.qty, 0)})
        </h1>
        {cartError && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-700">
            <span>
              {String(cartError).includes('500') || String(cartError).includes('Request failed')
                ? 'Something went wrong. Please try again.'
                : cartError}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearCartError();
                  useCartStore.getState().hydrateCart(useCartStore.getState().isLoggedIn);
                }}
                className="text-red-700 underline font-semibold hover:text-red-800 cursor-pointer"
              >
                Retry
              </button>
              <button type="button" onClick={clearCartError} className="text-red-700 hover:underline cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border/40 bg-surface p-12 sm:p-16 text-center max-w-md mx-auto shadow-xs">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-content">The bag is empty</h2>
            <p className="mt-2 text-base text-content-muted">
              Thirteen shelves of Goa are waiting.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center justify-center rounded-pill bg-palm px-8 py-3 text-sm font-semibold text-content-ondark hover:bg-ink-deep transition-all duration-200 shadow-md active:scale-[0.98]"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Items List */}
            <div className="lg:col-span-8 rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 divide-y divide-border/20">
              {items.map(({ product, qty }) => {
                const itemPrice = product.price ?? product.price_paise ?? 0;
                const itemImg = product.imageSrc || product.image_url || '/images/catalog/goan-themed-blue-mug.jpg';
                const itemWeight = product.weight || product.unit_label || '';
                return (
                  <div key={product.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-6">
                    <img
                      src={itemImg}
                      alt={product.name}
                      className="h-28 w-28 rounded-xl object-cover bg-surface-muted shrink-0 border border-border/20"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <Link
                            to={`/product/${product.slug}`}
                            className="font-display text-lg font-bold text-content hover:text-accent transition-colors"
                          >
                            {product.name}
                          </Link>
                        </div>
                        <p className="text-xs text-content-muted mt-1">
                          {itemWeight ? `${itemWeight} · ` : ''}
                          <span className="font-semibold text-content">{formatPrice(itemPrice)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Stepper + Dustbin Button */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center rounded-pill border border-border bg-ground px-3 py-1">
                            <button
                              onClick={() => updateQty(product.id, qty - 1)}
                              className="p-1 text-content hover:text-accent cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm font-bold text-content">{qty}</span>
                            <button
                              onClick={() => updateQty(product.id, qty + 1)}
                              disabled={qty >= 20}
                              className="p-1 text-content hover:text-accent disabled:opacity-30 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label={`Remove ${product.name} from bag`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="font-sans text-base sm:text-lg font-bold tabular-nums tracking-tight text-content">
                          {formatPrice(itemPrice * qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
                <h2 className="font-display text-xl font-bold text-content border-b border-border/30 pb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm text-content">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Products Subtotal</span>
                    <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Estimated Delivery</span>
                    <span className="text-xs text-palm font-semibold">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4 flex justify-between text-lg font-bold text-content">
                  <span>Subtotal</span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-accent">{formatPrice(subtotal)}</span>
                </div>

                <p className="text-[11px] text-content-muted leading-relaxed">
                  Prices inclusive of GST. Orders ship in 24–48 hours across India from Fontainhas.
                </p>

                <Link
                  to={user ? '/checkout' : '/login?redirect=/checkout'}
                  className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent py-4 text-sm font-bold text-white hover:bg-accent-hover transition-colors shadow-sm"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
