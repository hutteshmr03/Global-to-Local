import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  IndianRupee,
  Package,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/admin/dashboard');
      setData(res);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-palm border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-content-muted">Loading live database metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-accent mx-auto" />
          <p className="text-sm font-semibold text-accent">{error}</p>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 rounded-pill bg-palm px-4 py-2 text-xs font-bold text-white hover:bg-palm-shade shadow-xs min-h-[44px] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-accent">Operations Overview</span>
          <h1 className="mt-1 font-sans text-2xl sm:text-3xl font-bold text-content">Admin Dashboard</h1>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-palm'}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* 5 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Today's Orders */}
        <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">Today's Orders</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-palm/10 text-palm">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-bold text-content tabular-nums">
              {data.today_orders_count}
            </span>
            <span className="text-xs text-content-muted">placed today</span>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-palm hover:text-accent transition-colors pt-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 2. Pending Orders */}
        <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">Pending Fulfillment</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-bold text-accent tabular-nums">
              {data.pending_orders_count}
            </span>
            <span className="text-xs text-content-muted">need action</span>
          </div>
          <Link
            to="/admin/orders?status=paid"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-palm hover:text-accent transition-colors pt-1"
          >
            <span>Filter Paid / Packed</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 3. Total Store Revenue */}
        <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">Total Revenue</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-palm/10 text-palm">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-sans text-2xl font-bold text-content tabular-nums">
              ₹{((data.revenue_paise || 0) / 100).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-content-subtle pt-1">
            Paid & delivered orders
          </p>
        </div>

        {/* 4. Active Products */}
        <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">Active Products</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-surface-muted text-content">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-bold text-content tabular-nums">
              {data.products_count}
            </span>
            <span className="text-xs text-content-muted">in 13 shelves</span>
          </div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-palm hover:text-accent transition-colors pt-1"
          >
            <span>Manage Pricing</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 5. New Enquiries */}
        <div className="rounded-2xl border border-border/60 bg-surface p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">New Enquiries</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-palm/10 text-palm">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-bold text-content tabular-nums">
              {data.new_enquiries_count}
            </span>
            <span className="text-xs text-content-muted">inbox</span>
          </div>
          <Link
            to="/admin/enquiries"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-palm hover:text-accent transition-colors pt-1"
          >
            <span>Open Enquiries</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/products"
          className="group rounded-2xl border border-border/60 bg-surface p-6 shadow-xs hover:border-palm transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-base sm:text-lg font-bold text-content group-hover:text-palm transition-colors">
              Catalogue & Price Editing
            </span>
            <ArrowRight className="w-4 h-4 text-content-muted group-hover:text-palm group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-content-muted leading-relaxed">
            Update prices with mandatory audit reasons, check price change logs, and toggle public shelf visibility.
          </p>
        </Link>

        <Link
          to="/admin/orders"
          className="group rounded-2xl border border-border/60 bg-surface p-6 shadow-xs hover:border-palm transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-base sm:text-lg font-bold text-content group-hover:text-palm transition-colors">
              Orders & Tracking
            </span>
            <ArrowRight className="w-4 h-4 text-content-muted group-hover:text-palm group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-content-muted leading-relaxed">
            Progress forward-only order statuses (Paid → Packed → Shipped → Delivered), attach AWB numbers, and email customers.
          </p>
        </Link>

        <Link
          to="/admin/enquiries"
          className="group rounded-2xl border border-border/60 bg-surface p-6 shadow-xs hover:border-palm transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-base sm:text-lg font-bold text-content group-hover:text-palm transition-colors">
              Enquiries & Custom Hampers
            </span>
            <ArrowRight className="w-4 h-4 text-content-muted group-hover:text-palm group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-content-muted leading-relaxed">
            Process incoming corporate bulk orders and Goa-only custom hamper requests received from the contact page.
          </p>
        </Link>
      </div>

      {/* Recent Orders Live Feed */}
      <div className="rounded-2xl border border-border/60 bg-surface p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/30 pb-4">
          <div>
            <h2 className="font-sans text-lg font-bold text-content">Recent Orders Feed</h2>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-pill bg-palm px-4 py-2 text-xs font-semibold text-white hover:bg-palm-shade transition-all shadow-xs min-h-[44px]"
          >
            <span>All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!data.recent_orders || data.recent_orders.length === 0) ? (
          <p className="text-center py-6 text-xs text-content-muted">No orders found in database yet.</p>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto hide-scrollbar">
              <table className="w-full text-left text-xs text-content">
                <thead>
                  <tr className="border-b border-border/40 text-content-subtle uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-bold">Order ID</th>
                    <th className="py-2.5 font-bold">Customer</th>
                    <th className="py-2.5 font-bold">Total</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-ground/50 transition-colors">
                      <td className="py-3 font-sans font-bold text-palm">{ord.order_number}</td>
                      <td className="py-3 font-medium">{ord.customer_name}</td>
                      <td className="py-3 font-sans font-bold tabular-nums">₹{((ord.total_paise || 0) / 100).toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span className="inline-block rounded-pill bg-palm/10 border border-palm/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-palm">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="font-bold text-accent hover:underline py-1 px-2 inline-block min-h-[44px] leading-[44px]"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden space-y-3">
              {data.recent_orders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-border/60 bg-ground/40 p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-palm text-sm">{ord.order_number}</span>
                    <span className="rounded-pill bg-palm/10 border border-palm/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-palm">
                      {ord.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-content-muted">
                    <span>Customer: <strong className="text-content font-medium">{ord.customer_name}</strong></span>
                    <span className="font-sans font-bold tabular-nums text-content text-sm">
                      ₹{((ord.total_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-1">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="w-full min-h-[44px] flex items-center justify-center rounded-xl border border-border bg-surface text-content font-bold hover:bg-surface-muted transition-colors shadow-xs"
                    >
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
