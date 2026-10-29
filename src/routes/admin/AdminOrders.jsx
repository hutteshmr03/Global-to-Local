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
  Download,
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
  const [exporting, setExporting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    if (typeof localStorage !== 'undefined') {
      try {
        ['gtl_mock_orders_v1', 'gtl_mock_orders_v2', 'gtl_mock_orders_v3'].forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiFetch(`/api/v1/admin/orders?${params.toString()}`);
      const rawItems = res.items || [];
      const cleanItems = rawItems.filter(
        (o) =>
          o.order_number &&
          !['GTL-2026-2A1E82F1', 'GTL-2026-4DB2743C', 'GTL-2026-06153F1B', 'GTL-2026-0FADE939', 'GTL-2026-1004', 'GTL-2026-1003', 'GTL-2026-1002', 'GTL-2026-1001'].includes(o.order_number) &&
          !String(o.order_number).startsWith('GTL-2026-100')
      );
      setOrders(cleanItems);
      setTotal(cleanItems.length);
    } catch (err) {
      setError(err?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const downloadClientSideReport = () => {
    const now = new Date();
    const monthYear = now.toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_');
    const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    
    let csv = 'GLOBAL TO LOCAL — MONTHLY PERFORMANCE REPORT\r\n';
    csv += 'Store: Tarcar Mansion Fontainhas Panaji Goa 403001\r\n';
    csv += `Report Generated: ${now.toISOString()}\r\n`;
    csv += `Reporting Window: ${firstDay.toISOString()} to ${now.toISOString()}\r\n\r\n`;
    
    csv += '--- MONTHLY SUMMARY ---\r\n';
    csv += `Total Orders Placed,${orders.length}\r\n`;
    const rev = orders.reduce((s, o) => s + (o.total_paise || 0), 0);
    csv += `Total Revenue (INR),₹${(rev / 100).toFixed(2)}\r\n\r\n`;

    csv += '--- ORDERS & REVENUE ---\r\n';
    csv += 'Order Number,Placed At,Customer Name,Phone,City,Status,Items Count,Total (INR)\r\n';
    orders.forEach((o) => {
      const name = (o.customer_name || o.recipient_name || 'Customer').replace(/,/g, ' ');
      const phone = o.customer_phone || '';
      const city = (o.city || '').replace(/,/g, ' ');
      const stat = o.status || 'paid';
      const count = o.items_count || (o.items ? o.items.length : 1);
      const tot = ((o.total_paise || 0) / 100).toFixed(2);
      csv += `${o.order_number},${o.placed_at || ''},${name},${phone},${city},${stat},${count},${tot}\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GTL_Monthly_Report_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const isHosted =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';
      
      const primaryUrl = isHosted
        ? 'https://global-to-local.onrender.com/api/v1/admin/reports/monthly-export'
        : '/api/v1/admin/reports/monthly-export';

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('gtl_access_token') : null;
      let res = null;

      try {
        res = await fetch(primaryUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, text/csv',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (e) {}

      if ((!res || !res.ok) && isHosted && primaryUrl !== '/api/v1/admin/reports/monthly-export') {
        try {
          res = await fetch('/api/v1/admin/reports/monthly-export', {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, text/csv',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
        } catch (e) {}
      }

      if (res && res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get('content-disposition') || '';
        let filename = 'GTL_Monthly_Report.xlsx';
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        } else {
          const now = new Date();
          const monthStr = now.toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_');
          filename = `GTL_Monthly_Report_${monthStr}.xlsx`;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        downloadClientSideReport();
      }
    } catch (err) {
      downloadClientSideReport();
    } finally {
      setExporting(false);
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
          <h1 className="font-sans text-2xl sm:text-3xl text-content font-bold">Orders Management</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-palm hover:bg-palm-shade text-white text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Export monthly performance report starting from 1st of month to current second (.xlsx)"
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export Monthly Report (.xlsx)</span>
          </button>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-ground text-content text-sm transition-colors shadow-xs cursor-pointer"
            title="Refresh orders list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
            <input
              type="text"
              placeholder="Search by order number (GTL-...), customer email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ground border border-border rounded-xl text-sm text-content placeholder-content-subtle focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-content-subtle shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-56 px-3 py-2 bg-ground border border-border rounded-xl text-sm text-content focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
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
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`text-xs px-3.5 py-1 rounded-full border transition-all cursor-pointer ${
                statusFilter === filter.value
                  ? 'bg-[#C45C4A] text-white border-[#C45C4A] font-bold shadow-xs'
                  : 'bg-ground text-content-muted border-border hover:bg-surface hover:text-content'
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
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-content">
            Showing <span className="font-bold">{orders.length}</span> of {total} orders
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-content-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-accent" />
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
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ground/75 border-b border-border text-xs font-semibold text-content-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Order #</th>
                    <th className="px-5 py-3.5">Date Placed</th>
                    <th className="px-5 py-3.5">Recipient & Destination</th>
                    <th className="px-5 py-3.5">Items</th>
                    <th className="px-5 py-3.5">Total (₹)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
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
                      <tr key={o.id} className="hover:bg-ground/40 transition-colors">
                        <td className="px-5 py-4 font-sans font-bold text-accent">
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
                          <div className="font-medium text-content">{o.recipient_name || o.customer_name || o.shipping_address?.recipient_name || 'Customer'}</div>
                          <div className="text-xs text-content-muted mt-0.5">
                            {o.city || o.shipping_address?.city || 'Panaji'}, {o.state || o.shipping_address?.state || 'Goa'} {(o.pincode || o.shipping_address?.pincode) ? `(${o.pincode || o.shipping_address?.pincode})` : ''}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-content-muted">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-ground border border-border/40 text-content text-xs font-medium">
                            {o.item_count || (Array.isArray(o.items) && o.items.length > 0 ? o.items.reduce((s, it) => s + (it.quantity || 1), 0) : 1)} {(o.item_count === 1 || (Array.isArray(o.items) && o.items.length === 1)) ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-content whitespace-nowrap">
                          <div className="font-semibold text-content" title={`${o.total_paise || o.total_amount_paise || 0} paise`}>
                            ₹{(((o.total_paise || o.total_amount_paise || (o.total ? Math.round(o.total * 100) : 0)) || 55000) / 100).toLocaleString('en-IN')}
                          </div>
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-ground text-content text-xs font-semibold shadow-xs transition-all min-h-[36px]"
                          >
                            View & Process
                            <ChevronRight className="h-3 w-3 text-content-subtle" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-border/60">
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
                  <div key={o.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="font-sans font-bold text-accent text-sm hover:underline"
                        >
                          {o.order_number}
                        </Link>
                        <p className="text-xs text-content-muted mt-0.5">{dateStr}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5 pt-1">
                      <div className="font-semibold text-content text-sm">{o.recipient_name}</div>
                      <div className="text-content-muted">
                        {o.city}, {o.state} {o.pincode ? `(${o.pincode})` : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ground border border-border/60 text-content text-xs font-medium">
                        {o.item_count} {o.item_count === 1 ? 'item' : 'items'}
                      </span>
                      <div className="text-right">
                        <span className="text-content-muted text-[11px]">Total: </span>
                        <span className="font-bold text-sm text-content">
                          ₹{((o.total_paise || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-ground text-content text-xs font-bold shadow-xs transition-all min-h-[44px]"
                      >
                        <span>View & Process</span>
                        <ChevronRight className="h-3.5 w-3.5 text-content-subtle" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
