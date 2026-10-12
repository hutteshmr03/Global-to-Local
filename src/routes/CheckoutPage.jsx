import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MapPin, Truck, CreditCard, Lock, Plus, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { useAuthStore } from '../lib/auth-store';
import { formatPrice } from '../lib/data';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const addOrder = useAuthStore(state => state.addOrder);
  const items = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const subtotal = useCartStore(state => state.getSubtotalPaise());

  if (!user) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0] || null;

  // Selected address id: either a saved address ID or 'new'
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr ? defaultAddr.id : 'new');
  const [saveToProfile, setSaveToProfile] = useState(true);

  // Custom/New Address Fields
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Calculate current active address
  const activeSavedAddress = selectedAddressId !== 'new'
    ? savedAddresses.find(a => a.id === selectedAddressId)
    : null;

  const activeAddress = activeSavedAddress
    ? {
        fullName: activeSavedAddress.name,
        phone: user?.phone || newAddress.phone,
        line1: activeSavedAddress.street,
        city: activeSavedAddress.city,
        state: activeSavedAddress.state,
        pincode: activeSavedAddress.pincode,
      }
    : newAddress;

  const [shippingCostPaise, setShippingCostPaise] = useState(
    activeAddress.pincode?.startsWith('403') ? 8000 : 12000
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (activeAddress.pincode?.startsWith('403')) {
      setShippingCostPaise(8000);
    } else {
      setShippingCostPaise(12000);
    }
  }, [activeAddress.pincode]);

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

  const hasValidAddress = Boolean(
    activeAddress.fullName?.trim() &&
    activeAddress.phone?.trim() &&
    activeAddress.line1?.trim() &&
    activeAddress.city?.trim() &&
    activeAddress.pincode?.trim()?.length === 6
  );

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!hasValidAddress) {
      alert('Please provide a complete delivery address before you can book an order.');
      return;
    }

    setIsProcessing(true);

    // Save newly entered address to customer profile if chosen or if they had 0 addresses
    if (selectedAddressId === 'new' && (saveToProfile || savedAddresses.length === 0)) {
      const newAddressObj = {
        id: 'addr_' + Date.now().toString(36),
        name: newAddress.fullName.trim(),
        street: newAddress.line1.trim(),
        city: newAddress.city.trim() || 'Panaji',
        state: newAddress.state.trim() || 'Goa',
        pincode: newAddress.pincode.trim(),
        isDefault: savedAddresses.length === 0,
      };
      updateProfile({ addresses: [...savedAddresses, newAddressObj] });
    }

    // Simulate Razorpay payment completion
    setTimeout(() => {
      const orderNumber = `GTL-26-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder = {
        id: orderNumber,
        orderNumber: orderNumber,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          weight: item.product.weight,
          qty: item.qty,
          imageSrc: item.product.imageSrc,
        })),
        subtotalPaise: subtotal,
        shippingCostPaise: shippingCostPaise,
        totalPaise: totalPaise,
        status: 'Preparing for dispatch',
        address: {
          fullName: activeAddress.fullName,
          phone: activeAddress.phone,
          line1: activeAddress.line1,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
        },
      };

      if (addOrder) {
        addOrder(newOrder);
      }

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
              <div className="flex items-center justify-between gap-3 font-display text-xl font-bold text-content mb-6 border-b border-border/30 pb-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h2>1. Delivery Address</h2>
                </div>
                {savedAddresses.length > 0 && selectedAddressId !== 'new' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId('new')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Use a Different Address</span>
                  </button>
                )}
                {selectedAddressId === 'new' && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId(defaultAddr ? defaultAddr.id : savedAddresses[0].id)}
                    className="text-xs font-semibold text-content-muted hover:text-content cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Case 1: Customer has saved addresses and is picking one */}
              {savedAddresses.length > 0 && selectedAddressId !== 'new' ? (
                <div className="space-y-3">
                  <p className="text-xs text-content-muted mb-2">Select a delivery location for this order:</p>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all ${
                          isSelected
                            ? 'border-palm bg-palm/5 ring-1 ring-palm shadow-xs'
                            : 'border-border/60 bg-ground hover:border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-palm focus:ring-palm"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-sm font-bold text-content uppercase tracking-wider">
                                  {addr.name}
                                </span>
                                {addr.isDefault && (
                                  <span className="inline-flex items-center gap-1 rounded-pill bg-palm/15 text-palm px-2 py-0.5 text-[10px] font-bold border border-palm/25">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs sm:text-sm text-content-muted leading-relaxed">
                                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-palm shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Case 2: Enter new delivery address (no address saved yet or user clicked add new) */
                <div className="space-y-4">
                  {savedAddresses.length === 0 && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent/5 p-3.5 text-xs font-medium text-accent">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">No delivery address saved.</span>
                        <p className="text-content-muted mt-0.5">Please add your shipping address below. Delivery address is required to book an order.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.fullName}
                        onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        placeholder="Recipient full name"
                        className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phone}
                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
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
                      value={newAddress.line1}
                      onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })}
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
                        value={newAddress.city}
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="City"
                        className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddress.pincode}
                        onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="6-digit pincode"
                        className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-palm"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-content cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={e => setSaveToProfile(e.target.checked)}
                      className="rounded border-border text-palm focus:ring-palm"
                    />
                    <span>Save this address to my profile for future orders</span>
                  </label>
                </div>
              )}
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
                    Shipping ({activeAddress.pincode?.startsWith('403') ? 'Goa Express' : 'Pan-India Standard'})
                  </span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(shippingCostPaise)}</span>
                </div>
                <div className="border-t border-border/30 pt-3 flex justify-between text-lg font-bold text-content">
                  <span>Total Payable</span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-accent">{formatPrice(totalPaise)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={!hasValidAddress || isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent py-4 text-base font-bold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isProcessing ? (
                  <span>Processing Payment...</span>
                ) : !hasValidAddress ? (
                  <span>Add Delivery Address to Place Order</span>
                ) : (
                  <span>Pay <span className="font-sans font-bold tabular-nums">{formatPrice(totalPaise)}</span> via Razorpay</span>
                )}
              </button>

              {!hasValidAddress && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-accent text-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Please provide your delivery address to enable booking.</span>
                </div>
              )}

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
