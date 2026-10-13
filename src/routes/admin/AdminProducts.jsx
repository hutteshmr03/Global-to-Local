import React, { useEffect, useState } from 'react';
import {
  Search,
  Package,
  Edit2,
  Eye,
  EyeOff,
  History,
  X,
  AlertTriangle,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

const SHELVES = [
  { slug: 'all', name: 'All 13 Shelves' },
  { slug: 'chutneys-and-spreads', name: 'Chutneys & Spreads' },
  { slug: 'farsaan', name: 'Farsaan' },
  { slug: 'grains', name: 'Grains' },
  { slug: 'hand-crafted', name: 'Hand-Crafted' },
  { slug: 'kunbi', name: 'Kunbi' },
  { slug: 'masala', name: 'Masala' },
  { slug: 'oils-vinegars', name: 'Oils & Vinegars' },
  { slug: 'papads-pickles', name: 'Papads & Pickles' },
  { slug: 'seafood', name: 'Seafood' },
  { slug: 'spices', name: 'Spices' },
  { slug: 'sustainable-products', name: 'Sustainable Products' },
  { slug: 'sweet', name: 'Sweet' },
  { slug: 'wellness', name: 'Wellness' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shelf, setShelf] = useState('all');
  const [error, setError] = useState('');

  // Inline Price Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [newRupees, setNewRupees] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Price History Modal State
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (shelf !== 'all') params.append('category', shelf);
      params.append('page_size', '250');

      const res = await apiFetch(`/api/v1/admin/products?${params.toString()}`);
      setProducts(res.items || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [shelf]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setNewRupees((prod.price_paise / 100).toString());
    setReason('');
    setEditError('');
    setEditSuccess('');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    const val = parseFloat(newRupees);
    if (isNaN(val) || val <= 0) {
      setEditError('Price must be greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setEditError('A non-empty reason is required for the audit trail.');
      return;
    }

    const newPaise = Math.round(val * 100);
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/admin/products/${editingProduct.id}/price`, {
        method: 'PATCH',
        body: {
          new_price_paise: newPaise,
          reason: reason.trim(),
        },
      });

      setEditSuccess(`Price updated to ₹${val.toFixed(2).replace(/\.00$/, '')} successfully.`);
      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, price_paise: newPaise, price_formatted: `₹${val}` } : p))
      );
      setTimeout(() => {
        setEditingProduct(null);
      }, 900);
    } catch (err) {
      setEditError(err.detail || err.message || 'Failed to update price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prod) => {
    try {
      const nextStatus = !prod.is_active;
      await apiFetch(`/api/v1/admin/products/${prod.id}/status`, {
        method: 'PATCH',
        body: { is_active: nextStatus },
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: nextStatus } : p))
      );
    } catch (err) {
      alert(err.detail || err.message || 'Failed to toggle status');
    }
  };

  const handleOpenHistory = async (prod) => {
    setHistoryProduct(prod);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/products/${prod.id}/price-history`);
      setHistoryItems(res || []);
    } catch (err) {
      alert('Failed to load price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Compute percentage difference for warning
  const currentRupees = editingProduct ? editingProduct.price_paise / 100 : 0;
  const targetRupees = parseFloat(newRupees) || 0;
  const pctChange = currentRupees > 0 ? (Math.abs(targetRupees - currentRupees) / currentRupees) * 100 : 0;
  const showWarning = pctChange > 25 && targetRupees > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">Catalogue Management</span>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-content">Products & Pricing</h1>
          <p className="mt-1 text-xs sm:text-sm text-content-muted">
            Inline price changes with audit trails, stock verification, and shelf visibility controls.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-palm'}`} />
          <span>Reload Products</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or slug..."
            className="w-full rounded-pill border border-border bg-surface py-2.5 pl-10 pr-4 text-xs font-medium text-content outline-none focus:border-palm shadow-xs"
          />
        </form>

        <select
          value={shelf}
          onChange={(e) => setShelf(e.target.value)}
          aria-label="Filter by shelf"
          className="rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content outline-none cursor-pointer focus:border-palm shadow-xs"
        >
          {SHELVES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product List Table / Cards */}
      <div className="rounded-2xl border border-border/60 bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-content-muted">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-palm border-t-transparent mb-2" />
            <p>Fetching catalogue items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-content-muted space-y-2">
            <Package className="w-8 h-8 text-content-subtle mx-auto" />
            <p className="font-semibold text-content">No products matched your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left text-xs text-content">
              <thead>
                <tr className="border-b border-border/40 bg-ground/50 text-content-subtle uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Product</th>
                  <th className="py-3 px-4 font-bold">Shelf</th>
                  <th className="py-3 px-4 font-bold">Price</th>
                  <th className="py-3 px-4 font-bold">Stock</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-ground/40 transition-colors">
                    {/* Title + SKU */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover bg-surface-sunken shrink-0 border border-border/40"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-content truncate max-w-xs">{p.name}</p>
                          <p className="font-mono text-[10px] text-content-subtle">
                            {p.sku} • {p.unit_label}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Shelf */}
                    <td className="py-3 px-4 font-medium text-content-muted">{p.category_name}</td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-sm text-content">
                        {p.price_formatted}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-content tabular-nums">
                        {p.stock_qty} on hand
                      </span>
                      {p.reserved_qty > 0 && (
                        <p className="text-[10px] text-accent">({p.reserved_qty} reserved)</p>
                      )}
                    </td>

                    {/* Status (Visible / Hidden) */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                          p.is_active
                            ? 'bg-palm/15 text-palm border-palm/30 hover:bg-palm/25'
                            : 'bg-content-subtle/15 text-content-muted border-border hover:bg-content-subtle/25'
                        }`}
                        title={p.is_active ? 'Click to hide from store' : 'Click to show in store'}
                      >
                        {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{p.is_active ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-pill border border-palm bg-surface px-3 py-1 text-[11px] font-semibold text-palm hover:bg-palm hover:text-white transition-all shadow-xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Price</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenHistory(p)}
                          className="p-1 rounded-full text-content-subtle hover:text-content hover:bg-surface-muted transition-colors"
                          title="View price history audit log"
                          aria-label={`Price history for ${p.name}`}
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INLINE PRICE EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">Audit-Logged Edit</span>
                <h2 className="font-display text-lg font-bold text-content mt-0.5">Change Product Price</h2>
                <p className="text-xs text-content-muted truncate max-w-xs">{editingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-content-subtle hover:text-content"
                aria-label="Close price edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4 pt-1">
              {/* Old vs New comparison */}
              <div className="rounded-2xl border border-border/60 bg-ground/80 p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-content-muted">Current Price:</span>
                  <span className="font-mono font-bold text-content">
                    ₹{(editingProduct.price_paise / 100).toFixed(2).replace(/\.00$/, '')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content mb-1">
                    New Price (in ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-content-muted">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={newRupees}
                      onChange={(e) => setNewRupees(e.target.value)}
                      placeholder="e.g. 550"
                      className="w-full rounded-pill border border-border bg-surface py-2 pl-8 pr-4 font-mono text-sm font-bold text-content outline-none focus:border-palm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Warning if change > 25% */}
                {showWarning && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Warning: Price change is {pctChange.toFixed(1)}% (exceeds 25%).</span>
                  </div>
                )}
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Reason for Price Change * <span className="text-[10px] text-content-subtle font-normal">(Recorded in audit log)</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Raw material cost update / Monsoon seasonal batch"
                  className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm"
                />
              </div>

              {editError && (
                <p className="text-xs font-semibold text-accent">{editError}</p>
              )}

              {editSuccess && (
                <p className="text-xs font-semibold text-palm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{editSuccess}</span>
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-pill bg-palm py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm & Audit Log Price'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-pill border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-content hover:bg-surface-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICE HISTORY AUDIT DRAWER / MODAL */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-border/40 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">Audit History</span>
                <h2 className="font-display text-lg font-bold text-content mt-0.5">Price Change History</h2>
                <p className="text-xs text-content-muted">{historyProduct.name} ({historyProduct.sku})</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="p-1 text-content-subtle hover:text-content"
                aria-label="Close price history modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-content-muted">Loading audit entries...</div>
            ) : historyItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-content-muted">No prior price modifications recorded.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/50 bg-ground/60 p-3.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-content-subtle line-through">{item.old_price_formatted}</span>
                        <ArrowRight className="w-3 h-3 text-accent" />
                        <span className="font-mono font-bold text-palm">{item.new_price_formatted}</span>
                      </div>
                      <span className="text-[10px] text-content-subtle">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-content font-medium">"{item.reason}"</p>
                    {item.ip && <p className="text-[10px] font-mono text-content-subtle">Admin IP: {item.ip}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
