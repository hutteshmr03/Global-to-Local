import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Orders' },
  { value: 'paid', label: 'Paid (Ready to Pack)' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'cancelled', label: 'Cancelled' },
];

function getStatusBadge(status) {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="h-3 w-3 inline mr-1 text-emerald-600" />,
      };
    case 'packed':
      return {
        label: 'Packed',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Package className="h-3 w-3 inline mr-1 text-amber-600" />,
      };
    case 'shipped':
      return {
        label: 'Shipped',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: <Truck className="h-3 w-3 inline mr-1 text-blue-600" />,
      };
    case 'delivered':
      return {
        label: 'Delivered',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-medium',
        icon: <CheckCircle className="h-3 w-3 inline mr-1 text-emerald-700" />,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: <XCircle className="h-3 w-3 inline mr-1 text-rose-600" />,
      };
    case 'pending_payment':
    default:
      return {
        label: 'Pending Payment',
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        icon: <Clock className="h-3 w-3 inline mr-1 text-stone-500" />,
      };
  }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiFetch(`/api/v1/admin/orders?${params.toString()}`);
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-content font-bold">Orders Management</h1>
          <p className="text-sm text-content-muted mt-1">
            Track customer orders, confirm packaging, assign tracking, and update dispatch status.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-lg border border-edge bg-canvas hover:bg-stone-50 text-content text-sm transition-colors shadow-2xs"
          title="Refresh orders list"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-canvas border border-edge rounded-xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search by order number (GTL-...), customer email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ground border border-edge rounded-lg text-sm text-content placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-56 px-3 py-2 bg-ground border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-colors"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick status pill tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-edge-subtle">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === filter.value
                  ? 'bg-terracotta text-white border-terracotta font-medium'
                  : 'bg-ground text-content-muted border-edge hover:bg-stone-100 hover:text-content'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load orders</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-canvas border border-edge rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
          <div className="text-sm font-medium text-content">
            Showing <span className="font-bold">{orders.length}</span> of {total} orders
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-content-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-terracotta" />
            <p className="text-sm">Loading orders registry...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-content">No orders found</h3>
            <p className="text-sm text-content-muted mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'No orders have been placed in the store yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ground/75 border-b border-edge text-xs font-semibold text-content-muted uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order #</th>
                  <th className="px-5 py-3.5">Date Placed</th>
                  <th className="px-5 py-3.5">Recipient & Destination</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total (Paise / ₹)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {orders.map((o) => {
                  const badge = getStatusBadge(o.status);
                  const dateStr = o.placed_at
                    ? new Date(o.placed_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-terracotta">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="hover:underline flex items-center gap-1 group"
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-content-muted whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-content">{o.recipient_name}</div>
                        <div className="text-xs text-content-muted mt-0.5">
                          {o.city}, {o.state} {o.pincode ? `(${o.pincode})` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-content-muted">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-ground text-content text-xs font-medium">
                          {o.item_count} {o.item_count === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-content whitespace-nowrap">
                        <div>{o.total_formatted}</div>
                        <div className="text-[10px] text-content-muted font-mono">{o.total_paise} paise</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-edge bg-ground hover:bg-stone-100 text-content text-xs font-medium transition-colors"
                        >
                          View & Process
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
