import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCartStore } from '../../lib/cart-store';
import { useAuthStore } from '../../lib/auth-store';
import { formatPrice } from '../../lib/data';

export default function BagDrawer() {
  const user = useAuthStore(state => state.user);
  const isOpen = useCartStore(state => state.isOpen);
  const closeCart = useCartStore(state => state.closeCart);
  const items = useCartStore(state => state.items);
  const updateQty = useCartStore(state => state.updateQty);
  const removeItem = useCartStore(state => state.removeItem);
  const subtotal = useCartStore(state => state.getSubtotalPaise());
  const cartError = useCartStore(state => state.cartError);
  const clearCartError = useCartStore(state => state.clearCartError);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Bag">
          {/* Dimmed Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-ink-deep/60 backdrop-blur-xs"
            onClick={closeCart}
          />

          {/* Slide-in Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-ground shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-palm" />
                <h2 className="font-display text-xl font-bold text-content">Shopping Cart</h2>
                <span className="text-xs font-semibold text-content-muted">
                  ({items.reduce((s, i) => s + i.qty, 0)} items)
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-content-muted hover:text-content rounded-full hover:bg-surface-muted transition-colors cursor-pointer"
                aria-label="Close Shopping Cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartError && (
              <div className="mx-6 mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-700">
                <span>
                  {String(cartError).includes('500') || String(cartError).includes('Request failed')
                    ? 'Something went wrong. Please try again.'
                    : cartError}
                </span>
                <div className="flex items-center gap-2">
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
                  <button type="button" onClick={clearCartError} className="text-red-700 hover:opacity-75 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Drawer Body - Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/20">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-16 px-4">
                  <h3 className="font-display text-2xl sm:text-[1.75rem] font-semibold text-content leading-tight">
                    The shopping cart is empty
                  </h3>
                  <Link
                    to="/shop"
                    onClick={closeCart}
                    className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-pill bg-palm px-8 py-3 text-sm font-semibold text-content-ondark hover:bg-ink-deep transition-all duration-200 shadow-md active:scale-[0.98]"
                  >
                    Start shopping
                  </Link>
                </div>
              ) : (
                items.map(({ product, qty }) => {
                  const itemPrice = product.price ?? product.price_paise ?? 0;
                  const itemImg = (product.imageSrc && !product.imageSrc.endsWith('goan-themed-blue-mug.jpg'))
                    ? product.imageSrc
                    : (product.slug ? `/images/catalog/${product.slug}.jpg` : (product.image_url || '/images/catalog/goan-themed-blue-mug.jpg'));
                  const itemWeight = product.weight || product.unit_label || '';
                  return (
                      <div key={product.id} className="py-4 flex gap-4">
                        <img
                          src={itemImg}
                          alt={product.imageAlt || product.name}
                          className="h-20 w-20 rounded-lg object-cover bg-surface-muted shrink-0 border border-border/20"
                        />
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <Link
                                to={`/product/${product.slug}`}
                                onClick={closeCart}
                                className="font-display text-sm font-semibold text-content hover:text-accent line-clamp-1 transition-colors"
                              >
                                {product.name}
                              </Link>
                            </div>
                            <p className="text-xs text-content-muted mt-0.5">
                              {itemWeight ? `${itemWeight} · ` : ''}
                              <span className="font-semibold text-content">{formatPrice(itemPrice)}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Stepper & Delete Dustbin */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-pill border border-border/50 bg-surface shadow-xs">
                                <button
                                  onClick={() => updateQty(product.id, qty - 1)}
                                  className="p-1 px-2.5 text-content hover:text-accent transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2 text-xs font-semibold text-content min-w-[20px] text-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQty(product.id, qty + 1)}
                                  disabled={qty >= 20}
                                  className="p-1 px-2.5 text-content hover:text-accent disabled:opacity-30 transition-colors cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(product.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-content-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove item"
                                aria-label={`Remove ${product.name} from bag`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="font-sans text-sm font-bold tabular-nums tracking-tight text-content">
                              {formatPrice(itemPrice * qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {/* Drawer Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/40 bg-surface p-6 space-y-4 shadow-lg">
                <div className="flex justify-between text-base font-semibold text-content">
                  <span>Subtotal</span>
                  <span className="font-sans font-bold tabular-nums text-lg tracking-tight text-content">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-content-muted">
                  Taxes included. Delivery calculated at checkout based on pincode.
                </p>
                <div className="flex flex-col gap-2.5">
                  <Link
                    to={user ? '/checkout' : '/login?redirect=/checkout'}
                    onClick={closeCart}
                    className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-6 py-3.5 text-sm font-bold text-white hover:bg-accent-hover transition-colors shadow-sm"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/bag"
                    onClick={closeCart}
                    className="flex w-full items-center justify-center rounded-pill border border-border px-6 py-2.5 text-sm font-semibold text-content hover:bg-surface-muted transition-colors"
                  >
                    View Full Shopping Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
