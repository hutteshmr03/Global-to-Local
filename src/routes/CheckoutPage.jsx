import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MapPin, Truck, CreditCard, Lock } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { formatPrice } from '../lib/data';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const subtotal = useCartStore(state => state.getSubtotalPaise());

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Goa',
    pincode: '403001',
  });

  const [shippingCostPaise, setShippingCostPaise] = useState(12000); // 120 INR default
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) {
    return (
      <main className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen text-center">
        <h1 className="font-display text-2xl font-bold text-content">Your Bag is Empty</h1>
        <p className="mt-2 text-sm text-content-muted">Please add products before checking out.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-pill bg-palm px-8 py-3 text-sm font-semibold text-white">
          Return to Shop
        </Link>
      </main>
    );
  }

  const totalPaise = subtotal + shippingCostPaise;

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setAddress({ ...address, pincode: val });
    // If Goa pincode (starts with 403), local rate 80 INR, else 120 INR
    if (val.startsWith('403')) {
      setShippingCostPaise(8000);
    } else {
      setShippingCostPaise(12000);
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Razorpay payment modal or test completion
    setTimeout(() => {
      const orderNumber = `GTL-26-${Math.floor(100000 + Math.random() * 900000)}`;
      clearCart();
      setIsProcessing(false);
      navigate(`/order/${orderNumber}`);
    }, 1200);
  };

  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-shell px-5 sm:px-8 lg:px-12">
        <Link
          to="/bag"
          className="inline-flex items-center gap-2 text-xs font-semibold text-content-muted hover:text-accent mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bag</span>
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-content mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Delivery Address & Payment */}
          <div className="lg:col-span-7 space-y-8">
            {/* Delivery Address */}
            <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 font-display text-xl font-bold text-content mb-6">
                <MapPin className="w-5 h-5 text-accent" />
                <h2>1. Delivery Address</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={e => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="e.g. Maria Fernandes"
                      className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={address.phone}
                      onChange={e => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content mb-1">Street Address / House No. *</label>
                  <input
                    type="text"
                    required
                    value={address.line1}
                    onChange={e => setAddress({ ...address, line1: e.target.value })}
                    placeholder="House / Flat No., Street, Landmark"
                    className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                      placeholder="Panaji, Margao..."
                      className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={e => setAddress({ ...address, state: e.target.value })}
                      className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      pattern="[1-9][0-9]{5}"
                      value={address.pincode}
                      onChange={handlePincodeChange}
                      placeholder="6-digit pincode"
                      className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 font-display text-xl font-bold text-content mb-4">
                <CreditCard className="w-5 h-5 text-accent" />
                <h2>2. Payment (Razorpay Secure)</h2>
              </div>
              <p className="text-xs text-content-muted mb-6">
                Pay securely with UPI (Google Pay, PhonePe, Paytm), Credit/Debit Card, or Net Banking.
              </p>

              <div className="rounded-xl border border-palm/30 bg-palm/5 p-4 flex items-center gap-3 text-xs text-palm">
                <Lock className="w-5 h-5 shrink-0 text-palm" />
                <div>
                  <span className="font-bold">256-Bit SSL Encrypted Checkout</span>
                  <p className="text-content-muted">Your payment credentials are never stored on our servers.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="font-display text-xl font-bold text-content border-b border-border/30 pb-4">
                Order Review ({items.length} items)
              </h2>

              {/* Items Mini List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-border/20 pr-1">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <img src={product.imageSrc} alt="" className="h-10 w-10 rounded object-cover" />
                      <div>
                        <p className="font-semibold text-content line-clamp-1 max-w-[180px]">{product.name}</p>
                        <p className="text-xs text-content-muted">Qty: {qty} × <span className="font-sans font-medium tabular-nums">{formatPrice(product.price)}</span></p>
                      </div>
                    </div>
                    <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(product.price * qty)}</span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 text-sm text-content border-t border-border/30 pt-4">
                <div className="flex justify-between">
                  <span className="text-content-muted">Products Subtotal</span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">
                    Shipping ({address.pincode.startsWith('403') ? 'Goa Express' : 'Pan-India Standard'})
                  </span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(shippingCostPaise)}</span>
                </div>
                <div className="border-t border-border/30 pt-3 flex justify-between text-lg font-bold text-content">
                  <span>Total Payable</span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-accent">{formatPrice(totalPaise)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent py-4 text-base font-bold text-white hover:bg-accent-hover disabled:opacity-50 transition-all shadow-md"
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : (
                  <span>Pay <span className="font-sans font-bold tabular-nums">{formatPrice(totalPaise)}</span> via Razorpay</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-content-muted">
                <ShieldCheck className="w-4 h-4 text-palm" />
                <span>100% Satisfaction & Authenticity Guarantee</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
