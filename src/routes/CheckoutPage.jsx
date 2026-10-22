import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MapPin, Truck, CreditCard, Lock, Plus, Check, AlertCircle, Building2, Copy, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { useAuthStore } from '../lib/auth-store';
import { formatPrice, siteConfig } from '../lib/data';
import { apiFetch } from '../lib/api-client';

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idem_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const fetchMe = useAuthStore(state => state.fetchMe);
  const fetchOrders = useAuthStore(state => state.fetchOrders);
  const items = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);
  const subtotal = useCartStore(state => state.getSubtotalPaise());

  const idempotencyKeyRef = useRef(makeIdempotencyKey());
  const [checkoutError, setCheckoutError] = useState('');

  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0] || null;

  // Selected address id: either a saved address ID or 'new'
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr ? defaultAddr.id : 'new');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [copiedField, setCopiedField] = useState('');
  const [utrNumber, setUtrNumber] = useState('');

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Auto-select default address once loaded
  useEffect(() => {
    if (defaultAddr && (selectedAddressId === 'new' || !savedAddresses.some(a => a.id === selectedAddressId))) {
      setSelectedAddressId(defaultAddr.id);
    }
  }, [defaultAddr?.id, savedAddresses.length]);

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
        phone: activeSavedAddress.phone || user?.phone || newAddress.phone || '9876543210',
        line1: activeSavedAddress.street,
        city: activeSavedAddress.city,
        state: activeSavedAddress.state,
        pincode: activeSavedAddress.pincode,
      }
    : newAddress;

  const [shippingCostPaise, setShippingCostPaise] = useState(
    activeAddress.pincode?.startsWith('403') ? 8000 : 12000
  );
  const [shippingZoneName, setShippingZoneName] = useState(
    activeAddress.pincode?.startsWith('403') ? 'Goa Express' : 'Pan-India Standard'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const pin = (activeAddress.pincode || '').trim();
    if (pin.startsWith('403')) {
      setShippingCostPaise(8000);
      setShippingZoneName('Goa Express');
    } else {
      setShippingCostPaise(12000);
      setShippingZoneName('Pan-India Standard');
    }

    if (/^[1-9]\d{5}$/.test(pin)) {
      let cancelled = false;
      apiFetch(`/api/v1/shipping/estimate?pincode=${encodeURIComponent(pin)}`)
        .then((quote) => {
          if (!cancelled && quote && typeof quote.shipping_paise === 'number') {
            setShippingCostPaise(quote.shipping_paise);
            if (quote.zone_name) {
              setShippingZoneName(quote.zone_name);
            }
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [activeAddress.pincode]);

  if (!isInitialized) {
    return <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen" />;
  }

  if (!user) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (!hasValidAddress) {
      setCheckoutError('Please provide a complete delivery address before you can book an order.');
      return;
    }

    if (!utrNumber || !utrNumber.trim()) {
      setCheckoutError('Please transfer to the bank account above and enter your UTR / Reference Number before confirming.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        address_id: selectedAddressId !== 'new' ? selectedAddressId : undefined,
        address:
          selectedAddressId === 'new'
            ? {
                label: 'Home',
                recipient_name: activeAddress.fullName.trim(),
                phone: activeAddress.phone.trim(),
                line1: activeAddress.line1.trim(),
                city: activeAddress.city.trim() || 'Panaji',
                state: activeAddress.state.trim() || 'Goa',
                pincode: activeAddress.pincode.trim(),
              }
            : undefined,
        save_address: selectedAddressId === 'new' && (saveToProfile || savedAddresses.length === 0),
        customer_note: `Bank Transfer UTR: ${utrNumber.trim()}`,
        items: items.map(item => ({
          product_id: item.product.uuid || item.product.id,
          quantity: item.qty,
        })),
      };

      const createdOrder = await apiFetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: orderPayload,
      });

      const orderNumber = createdOrder.order_number || createdOrder.orderNumber;

      await fetchMe();
      await fetchOrders();
      await clearCart();
      idempotencyKeyRef.current = makeIdempotencyKey();
      setIsProcessing(false);
      navigate(`/order/${orderNumber}`);
    } catch (err) {
      setIsProcessing(false);
      idempotencyKeyRef.current = makeIdempotencyKey();
      setCheckoutError(err.message || 'Unable to process order. Please try again.');
    }
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
        {checkoutError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

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

            {/* Payment Method - Direct Bank Transfer */}
            <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 font-display text-xl font-bold text-content mb-6">
                <Building2 className="w-5 h-5 text-accent" />
                <h2>2. Direct Bank Transfer</h2>
              </div>

              {/* Bank Account Details Box */}
              <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Bank Transfer Details</span>
                  <span className="text-[11px] font-semibold text-content-muted">Bank of India</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  {/* Account Name */}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-content-muted">Account Name:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-content">
                      <span>{siteConfig.contact.bankDetails?.accountName || 'Global To Local'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(siteConfig.contact.bankDetails?.accountName || 'Global To Local', 'name')}
                        className="p-1 hover:text-accent cursor-pointer"
                        title="Copy Account Name"
                      >
                        {copiedField === 'name' ? <CheckCircle2 className="w-3.5 h-3.5 text-palm" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between py-1 border-t border-border/20">
                    <span className="text-content-muted">Account Number:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-content text-sm sm:text-base">
                      <span>{siteConfig.contact.bankDetails?.accountNumber || '102220110000268'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(siteConfig.contact.bankDetails?.accountNumber || '102220110000268', 'acc')}
                        className="p-1 hover:text-accent cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedField === 'acc' ? <CheckCircle2 className="w-3.5 h-3.5 text-palm" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="flex items-center justify-between py-1 border-t border-border/20">
                    <span className="text-content-muted">IFSC Code:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-accent">
                      <span>{siteConfig.contact.bankDetails?.ifscCode || 'BKID0001022'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(siteConfig.contact.bankDetails?.ifscCode || 'BKID0001022', 'ifsc')}
                        className="p-1 hover:text-accent cursor-pointer"
                        title="Copy IFSC Code"
                      >
                        {copiedField === 'ifsc' ? <CheckCircle2 className="w-3.5 h-3.5 text-palm" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Bank & Branch */}
                  <div className="flex items-center justify-between py-1 border-t border-border/20">
                    <span className="text-content-muted">Bank & Branch:</span>
                    <span className="font-semibold text-content">
                      {siteConfig.contact.bankDetails?.bankName || 'Bank of India'}, {siteConfig.contact.bankDetails?.branch || 'Miramar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Reference / UTR Number Input */}
              <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="utr-input" className="block text-xs sm:text-sm font-bold text-content">
                    Bank Reference / UTR Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Required</span>
                </div>
                <p className="text-xs text-content-muted leading-relaxed">
                  Transfer via UPI / NEFT / IMPS to our account above, then enter the 12-digit UTR or Reference number before confirming:
                </p>
                <input
                  id="utr-input"
                  type="text"
                  value={utrNumber}
                  onChange={e => {
                    setUtrNumber(e.target.value);
                    if (checkoutError) setCheckoutError('');
                  }}
                  placeholder="e.g. 230910482910 or UPI transaction ID"
                  className="w-full rounded-lg border-2 border-border/60 bg-ground px-4 py-2.5 text-xs sm:text-sm font-mono text-content outline-none focus:border-accent transition-colors"
                />
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
                {items.map(({ product, qty }) => {
                  const itemPrice = product.price ?? product.price_paise ?? 0;
                  const itemImg = (product.imageSrc && !product.imageSrc.endsWith('goan-themed-blue-mug.jpg'))
                    ? product.imageSrc
                    : (product.slug ? `/images/catalog/${product.slug}.jpg` : (product.image_url || '/images/catalog/goan-themed-blue-mug.jpg'));
                  return (
                    <div key={product.id} className="py-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <img src={itemImg} alt="" className="h-10 w-10 rounded object-cover" />
                        <div>
                          <p className="font-semibold text-content line-clamp-1 max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-content-muted">Qty: {qty} × <span className="font-sans font-medium tabular-nums">{formatPrice(itemPrice)}</span></p>
                        </div>
                      </div>
                      <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(itemPrice * qty)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 text-sm text-content border-t border-border/30 pt-4">
                <div className="flex justify-between">
                  <span className="text-content-muted">Products Subtotal</span>
                  <span className="font-sans font-bold tabular-nums tracking-tight text-content">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">
                    Shipping ({shippingZoneName})
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
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-accent py-4 text-base font-bold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
              >
                {isProcessing ? (
                  <span>Placing Your Order...</span>
                ) : !hasValidAddress ? (
                  <span>Add Delivery Address to Place Order</span>
                ) : (
                  <span>Confirm Order & Pay <span className="font-sans font-bold tabular-nums">{formatPrice(totalPaise)}</span> via Bank Transfer</span>
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
