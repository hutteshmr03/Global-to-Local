import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, MapPin, LogOut } from 'lucide-react';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-content mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-4">
            <div className="rounded-2xl border border-border/40 bg-surface p-4 space-y-1 shadow-xs">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'orders' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'addresses' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === 'profile' ? 'bg-palm text-white' : 'text-content hover:bg-surface-muted'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile Details</span>
              </button>
            </div>
          </div>

          {/* Main Area */}
          <div className="md:col-span-8">
            {activeTab === 'orders' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-8 shadow-xs">
                <h2 className="font-display text-xl font-bold text-content mb-4">Order History</h2>
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-content-muted">
                  <Package className="w-10 h-10 text-content-muted mx-auto mb-2" />
                  <p className="font-semibold text-content">No active or past orders found</p>
                  <p className="text-xs text-content-muted mt-1">When you place an order, its live tracking status will appear here.</p>
                  <Link
                    to="/shop"
                    className="mt-4 inline-block rounded-pill bg-palm px-6 py-2 text-xs font-semibold text-white hover:bg-palm-shade"
                  >
                    Start Shopping
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-8 shadow-xs">
                <h2 className="font-display text-xl font-bold text-content mb-4">Saved Delivery Addresses</h2>
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-content-muted">
                  <MapPin className="w-10 h-10 text-content-muted mx-auto mb-2" />
                  <p className="font-semibold text-content">No saved addresses</p>
                  <p className="text-xs text-content-muted mt-1">Addresses you use during checkout will be automatically saved here.</p>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="rounded-2xl border border-border/40 bg-surface p-8 shadow-xs space-y-4">
                <h2 className="font-display text-xl font-bold text-content mb-4">Profile Details</h2>
                <div>
                  <label className="block text-xs font-semibold text-content mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Valued Customer"
                    className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content mb-1">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="+91 98765 43210"
                    className="w-full rounded-lg border border-border bg-ground px-4 py-2.5 text-sm text-content outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
