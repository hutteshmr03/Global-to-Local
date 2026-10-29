import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut, ArrowRight, ShieldCheck, Plus, Check, Trash2, X, Edit2, Truck } from 'lucide-react';
import { useAuthStore } from '../lib/auth-store';
import { formatPrice } from '../lib/data';

export default function AccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const addAddress = useAuthStore((state) => state.addAddress);
  const setDefaultAddress = useAuthStore((state) => state.setDefaultAddress);
  const deleteAddress = useAuthStore((state) => state.deleteAddress);
  const fetchOrders = useAuthStore((state) => state.fetchOrders);
  const cancelOrder = useAuthStore((state) => state.cancelOrder);

  const [activeTab, setActiveTab] = useState('orders');
  const [addressError, setAddressError] = useState('');
  const [orderNotice, setOrderNotice] = useState({});

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user?.id, fetchOrders]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  const handleSetDefaultAddress = async (addressId) => {
    await setDefaultAddress(addressId);
  };

  const handleDeleteAddress = async (addressId) => {
    await deleteAddress(addressId);
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    setAddressError('');
    if (!newAddr.name.trim() || !newAddr.street.trim() || !newAddr.pincode.trim()) {
      setAddressError('Please fill in recipient name, street address, and pincode');
      return;
    }

    const res = await addAddress({
      name: newAddr.name.trim(),
      phone: user?.phone || '9876543210',
      street: newAddr.street.trim(),
      city: newAddr.city.trim() || 'Panaji',
      state: newAddr.state.trim() || 'Goa',
      pincode: newAddr.pincode.trim(),
      isDefault: newAddr.isDefault || (user?.addresses || []).length === 0,
    });

    if (!res.ok) {
      setAddressError(res.error || 'Could not save address');
      return;
    }

    setShowAddForm(false);
    setNewAddr({
      name: user?.name || '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
  };

  const handleCancelOrder = async (orderNumber) => {
    const res = await cancelOrder(orderNumber);
    if (!res.ok) {
      setOrderNotice((prev) => ({ ...prev, [orderNumber]: res.error || 'Please contact the store to cancel.' }));
    } else {
      setOrderNotice((prev) => ({ ...prev, [orderNumber]: 'Order cancelled.' }));
    }
  };

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  const handleStartEditingProfile = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setIsEditingProfile(true);
  };

  const handleCancelEditingProfile = () => {
    setIsEditingProfile(false);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileErrorMsg('');
    if (!profileForm.name.trim()) {
      setProfileErrorMsg('Full Name cannot be empty');
      return;
    }

    const res = await updateProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
    });

    if (res && res.ok === false) {
      setProfileErrorMsg(res.error || 'Failed to update profile');
      return;
    }

    setIsEditingProfile(false);
    setProfileSuccessMsg('Profile updated successfully!');
    setTimeout(() => {
      setProfileSuccessMsg('');
    }, 4000);
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      useAuthStore.setState({ user: null, isHydrating: false, isInitialized: true });
      navigate('/login', { replace: true });
    }
  };

  if (!isInitialized) {
    return <main id="main-content" className="pt-20 sm:pt-24 lg:pt-28 pb-16 bg-ground min-h-screen" />;
  }

  // If not logged in, redirect directly to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in as admin, redirect directly to admin portal
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main id="main-content" className="pt-20 sm:pt-24 lg:pt-28 pb-16 bg-ground min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        
        {/* Header with Customer Greeting */}
        <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3 border-b border-border/40 pb-4 sm:pb-5">
          <div className="min-w-0 pr-2">
            <span className="font-sans text-[11px] sm:text-xs font-bold uppercase tracking-widest text-accent">
              Welcome back
            </span>
            <h1 className="mt-0.5 font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-content truncate">
              {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-content-muted mt-0.5 truncate">
              {user.phone || user.email || 'Customer Account'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-3.5 py-2 sm:px-4 sm:py-2 text-xs font-semibold text-content hover:bg-surface-muted hover:border-content-subtle transition-all shadow-xs disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5 text-accent" />
            <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>

        {/* Phone-only Account Prompt: Add your email */}
        {!user.email && (
          <div className="mb-5 sm:mb-6 rounded-2xl border border-accent/25 bg-accent/5 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <p className="font-display text-sm sm:text-base font-bold text-content">
                Add your email
              </p>
              <p className="text-xs text-content-muted mt-0.5">
                Add your email address to receive order receipts, invoices, and courier tracking updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                handleStartEditingProfile();
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-palm px-4 py-2 text-xs font-semibold text-white hover:bg-palm-shade transition-all shadow-xs"
            >
              <span>Add your email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-4">
            <div className="rounded-2xl border border-border/40 bg-surface p-2 sm:p-2.5 space-y-1 shadow-xs">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'orders' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'addresses' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile Details</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-8">
            {activeTab === 'orders' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-content">Order History</h2>
                    <p className="text-xs text-content-muted mt-0.5">Track your orders and courier delivery status</p>
                  </div>
                  <span className="text-xs font-semibold text-content-muted">
                    {(user.orders || []).length} {(user.orders || []).length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                {(!user.orders || user.orders.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-border p-8 sm:p-10 text-center text-content-muted">
                    <Package className="w-10 h-10 text-content-muted mx-auto mb-2" />
                    <p className="font-semibold text-content">No active or past orders found</p>
                    <p className="text-xs text-content-muted mt-1 max-w-sm mx-auto">
                      When you order from any of our 13 shelves, your live courier tracking and invoices will appear here.
                    </p>
                    <Link
                      to="/shop"
                      className="mt-5 inline-block rounded-pill bg-palm px-6 py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs cursor-pointer transition-all"
                    >
                      Explore the Shelves
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.orders.map((order) => (
                      <div
                        key={order.orderNumber || order.id}
                        className="rounded-2xl border border-border/70 bg-ground/50 p-5 sm:p-6 transition-all hover:border-border hover:shadow-xs space-y-4"
                      >
                        {/* Order Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Order ID</span>
                            <p className="font-mono text-sm font-bold text-content">{order.orderNumber}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Date</span>
                            <p className="text-xs font-semibold text-content">{order.date}</p>
                          </div>
                          {(() => {
                            const st = String(order?.status || '').toLowerCase().trim();
                            if (st === 'delivered') {
                              return (
                                <div className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 px-3 py-1 text-xs font-bold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>Delivered</span>
                                </div>
                              );
                            }
                            if (st === 'shipped') {
                              return (
                                <div className="inline-flex items-center gap-1.5 rounded-pill bg-blue-500/15 border border-blue-500/30 text-blue-800 px-3 py-1 text-xs font-bold">
                                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Shipped</span>
                                </div>
                              );
                            }
                            if (st === 'packed') {
                              return (
                                <div className="inline-flex items-center gap-1.5 rounded-pill bg-amber-500/15 border border-amber-500/30 text-amber-800 px-3 py-1 text-xs font-bold">
                                  <Package className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Packed</span>
                                </div>
                              );
                            }
                            if (st === 'cancelled') {
                              return (
                                <div className="inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 border border-rose-500/30 text-rose-800 px-3 py-1 text-xs font-bold">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Cancelled</span>
                                </div>
                              );
                            }
                            return (
                              <div className="inline-flex items-center gap-1.5 rounded-pill bg-palm/15 border border-palm/25 text-palm px-3 py-1 text-xs font-bold">
                                <Package className="w-3.5 h-3.5" />
                                <span>{order.statusLabel || 'Preparing for dispatch'}</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-border/20">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                {item.imageSrc && (
                                  <img
                                    src={item.imageSrc}
                                    alt={item.name}
                                    className="h-11 w-11 rounded-lg object-cover bg-surface shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-content truncate">{item.name}</p>
                                  <p className="text-xs text-content-muted">
                                    Qty: {item.qty} {item.weight ? `• ${item.weight}` : ''}
                                  </p>
                                </div>
                              </div>
                              <span className="font-sans font-bold tabular-nums text-content shrink-0">
                                {formatPrice((item.price || 0) * (item.qty || 1))}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Total */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-3">
                          <div className="space-y-1">
                            {order.address && (
                              <p className="text-xs text-content-muted truncate max-w-sm">
                                Shipping to: <span className="font-medium text-content">{order.address.fullName || order.address.name}, {order.address.city || ''}</span>
                              </p>
                            )}
                            {(orderNotice[order.orderNumber] || order.cancelNotice) && (
                              <p className="text-[11px] font-medium text-content-muted">
                                {orderNotice[order.orderNumber] || order.cancelNotice}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-content-muted">Total Paid</span>
                              <p className="font-sans text-sm font-bold text-accent tabular-nums">
                                {formatPrice(order.totalPaise)}
                              </p>
                            </div>
                            {order.canCancel && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order.orderNumber)}
                                className="rounded-pill border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/20 transition-all cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                            <Link
                              to={`/order/${order.orderNumber}`}
                              className="rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-content hover:bg-surface-muted transition-all cursor-pointer"
                            >
                              View Receipt
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-6 sm:p-8 shadow-xs">
                {/* Header with Add Address button */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="font-display text-xl font-bold text-content">Saved Delivery Addresses</h2>
                  </div>
                  {!showAddForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-palm px-4 py-2 text-xs font-semibold text-white hover:bg-palm-shade transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* Inline Add Address Form */}
                {showAddForm && (
                  <form onSubmit={handleSaveNewAddress} className="mb-6 rounded-2xl border border-border/80 bg-ground p-5 sm:p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent">New Delivery Address</span>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-content-muted hover:text-content"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {addressError && (
                      <p className="text-xs font-medium text-red-600">{addressError}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">Recipient Name *</label>
                        <input
                          type="text"
                          required
                          value={newAddr.name}
                          onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                          placeholder="e.g. Huttesh"
                          className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm text-content outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newAddr.pincode}
                          onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="403001"
                          className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm text-content outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Street Address / House No. *</label>
                      <input
                        type="text"
                        required
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        placeholder="House No, Street, Landmark"
                        className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm text-content outline-none focus:border-accent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">City</label>
                        <input
                          type="text"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          placeholder="Panaji"
                          className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm text-content outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-content mb-1">State</label>
                        <input
                          type="text"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          placeholder="Goa"
                          className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs sm:text-sm text-content outline-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-content cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={newAddr.isDefault}
                        onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                        className="rounded border-border text-palm focus:ring-palm"
                      />
                      <span>Make this my default delivery address</span>
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="rounded-pill bg-palm px-6 py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs cursor-pointer"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="rounded-pill border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-content hover:bg-surface-muted cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Addresses List or Empty State */}
                {(!user.addresses || user.addresses.length === 0) && !showAddForm ? (
                  <div className="rounded-2xl border border-dashed border-border/80 bg-ground/50 p-8 sm:p-10 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface border border-border/60">
                      <MapPin className="h-5 w-5 text-content-muted" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-bold text-content">No Delivery Addresses Added Yet</h3>
                    <p className="mt-1 text-xs text-content-muted max-w-sm mx-auto">
                      You haven't saved any delivery address. Add your delivery address so you can checkout and place orders.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="mt-5 inline-flex items-center gap-1.5 rounded-pill bg-palm px-5 py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Your First Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {(user.addresses || []).map((addr) => (
                      <div
                        key={addr.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          addr.isDefault
                            ? 'border-palm/40 bg-ground/80 ring-1 ring-palm/20'
                            : 'border-border/60 bg-ground hover:border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="font-display text-sm font-bold text-content uppercase tracking-wider">
                                {addr.name}
                              </span>
                              {addr.isDefault ? (
                                <span className="inline-flex items-center gap-1 rounded-pill bg-palm/15 text-palm px-2.5 py-0.5 text-[10px] font-bold border border-palm/25">
                                  <Check className="w-3 h-3" />
                                  Default Address
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-xs sm:text-sm text-content-muted leading-relaxed">
                              {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>

                          {/* Delete Address */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-content-muted hover:text-red-600 transition-colors p-1.5 cursor-pointer rounded-full hover:bg-red-500/10"
                            title="Delete Address"
                            aria-label="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-7 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-content">Customer Profile</h2>
                    <p className="text-xs text-content-muted mt-0.5">Manage your personal details and contact info</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={handleStartEditingProfile}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-palm px-4 py-2 text-xs font-semibold text-white hover:bg-palm-shade transition-all shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {profileSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-palm/10 border border-palm/20 px-4 py-3 text-xs font-medium text-palm">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}
                {profileErrorMsg && (
                  <p className="text-xs font-medium text-red-600">{profileErrorMsg}</p>
                )}

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full rounded-pill border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus:bg-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full rounded-pill border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus:bg-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="yourname@example.com"
                        className="w-full rounded-pill border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none focus:border-accent focus:bg-surface"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-palm px-6 py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditingProfile}
                        className="rounded-pill border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-content hover:bg-surface-muted cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Full Name</label>
                      <div className="w-full rounded-pill border border-border/80 bg-ground/60 px-4 py-2.5 text-sm font-medium text-content">
                        {user.name || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Phone Number</label>
                      <div className="w-full rounded-pill border border-border/80 bg-ground/60 px-4 py-2.5 text-sm font-medium text-content">
                        {user.phone || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content mb-1">Email Address</label>
                      <div className="w-full rounded-pill border border-border/80 bg-ground/60 px-4 py-2.5 text-sm font-medium text-content">
                        {user.email || 'Not provided'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
