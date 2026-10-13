import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  MapPin,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

const NEXT_STATUS_MAP = {
  paid: { next: 'packed', label: 'Mark as Packed', icon: Package, description: 'Products gathered and boxed in Fontainhas workshop.' },
  packed: { next: 'shipped', label: 'Mark as Shipped', icon: Truck, description: 'Handed over to carrier (Goa Express / Pan-India Standard courier).' },
  shipped: { next: 'delivered', label: 'Mark as Delivered', icon: CheckCircle, description: 'Successfully handed to customer at destination.' },
};

function getStatusBadge(status) {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="h-4 w-4 inline mr-1 text-emerald-600" />,
      };
    case 'packed':
      return {
        label: 'Packed',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Package className="h-4 w-4 inline mr-1 text-amber-600" />,
      };
    case 'shipped':
      return {
        label: 'Shipped',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: <Truck className="h-4 w-4 inline mr-1 text-blue-600" />,
      };
    case 'delivered':
      return {
        label: 'Delivered',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
        icon: <CheckCircle className="h-4 w-4 inline mr-1 text-emerald-700" />,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: <XCircle className="h-4 w-4 inline mr-1 text-rose-600" />,
      };
    case 'pending_payment':
    default:
      return {
        label: 'Pending Payment',
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        icon: <Clock className="h-4 w-4 inline mr-1 text-stone-500" />,
      };
  }
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status Modal State
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [carrier, setCarrier] = useState('Delhivery Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Note creation state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/v1/admin/orders/${id}`);
      setOrder(data);
    } catch (err) {
      setError(err?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleOpenTransitionModal = (next) => {
    setTargetStatus(next);
    setStatusNote('');
    setStatusError('');
    if (next === 'shipped') {
      setCarrier('Delhivery Express');
      setTrackingNumber('');
      setTrackingUrl('');
    }
    setIsTransitionModalOpen(true);
  };

  const handleConfirmTransition = async (e) => {
    e.preventDefault();
    setSubmittingStatus(true);
    setStatusError('');

    try {
      await apiFetch(`/api/v1/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          new_status: targetStatus,
          carrier: targetStatus === 'shipped' ? carrier : undefined,
          tracking_number: targetStatus === 'shipped' ? trackingNumber : undefined,
          tracking_url: targetStatus === 'shipped' ? trackingUrl : undefined,
          note: statusNote.trim() || undefined,
        }),
      });

      setIsTransitionModalOpen(false);
      await fetchOrderDetail();
    } catch (err) {
      setStatusError(err?.message || 'Failed to update order status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    setNoteError('');
    try {
      await apiFetch(`/api/v1/admin/orders/${order.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });
      setNewNote('');
      await fetchOrderDetail();
    } catch (err) {
      setNoteError(err?.message || 'Failed to add note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-content-muted">
        <Package className="h-8 w-8 animate-spin mx-auto mb-3 text-terracotta" />
        <p className="text-sm">Retrieving order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all orders
        </Link>
        <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <h3 className="font-semibold text-lg">Order Not Found</h3>
          <p className="text-sm mt-1">{error || 'This order does not exist or has been archived.'}</p>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(order.status);
  const nextTransition = NEXT_STATUS_MAP[order.status];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-content-muted hover:text-content transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        {nextTransition && (
          <button
            onClick={() => handleOpenTransitionModal(nextTransition.next)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white font-medium text-sm transition-colors shadow-2xs"
          >
            <nextTransition.icon className="h-4 w-4" />
            {nextTransition.label}
          </button>
        )}
      </div>

      {/* Order Header Card */}
      <div className="bg-canvas border border-edge rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold text-content">{order.order_number}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${badge.bg}`}>
                {badge.icon}
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-content-muted mt-1.5">
              Placed on{' '}
              {order.placed_at
                ? new Date(order.placed_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '—'}
              {order.paid_at && (
                <>
                  {' '}• Paid on{' '}
                  {new Date(order.paid_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </>
              )}
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-content-muted uppercase tracking-wider font-semibold">Total Amount</div>
            <div className="font-serif text-2xl text-content font-bold">
              ₹{(order.total_paise / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-content-muted">
              Tax inclusive
            </div>
          </div>
        </div>

        {/* Forward-only progression ribbon */}
        <div className="mt-6 pt-5 border-t border-edge-subtle">
          <div className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-3">
            Fulfillment Progression (Strict Forward Only)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'paid', label: '1. Paid', desc: 'Verified' },
              { key: 'packed', label: '2. Packed', desc: 'In Box' },
              { key: 'shipped', label: '3. Shipped', desc: 'In Transit' },
              { key: 'delivered', label: '4. Delivered', desc: 'Handed over' },
            ].map((step, idx) => {
              const orderSteps = ['paid', 'packed', 'shipped', 'delivered'];
              const currentIdx = orderSteps.indexOf(order.status);
              const stepIdx = orderSteps.indexOf(step.key);
              const isPast = stepIdx <= currentIdx && currentIdx !== -1;
              const isCurrent = order.status === step.key;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                    isCurrent
                      ? 'border-terracotta bg-terracotta/5 font-semibold text-terracotta'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-edge bg-ground/50 text-content-muted'
                  }`}
                >
                  <div className="font-medium">{step.label}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Order Items & Customer / Delivery Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items snapshot */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-canvas border border-edge rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-edge">
              <h2 className="font-semibold text-base text-content">Items in Order ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-edge">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
                  <img
                    src={item.image_url || '/images/catalog/goan-themed-blue-mug.jpg'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-ground border border-edge shrink-0"
                    onError={(e) => {
                      e.target.src = '/images/catalog/goan-themed-blue-mug.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-content truncate">{item.name}</h3>
                    <p className="text-xs text-content-muted mt-0.5">
                      SKU: <span className="font-mono">{item.sku}</span> {item.unit_label ? `• ${item.unit_label}` : ''}
                    </p>
                    <p className="text-xs text-content-muted mt-1">
                      ₹{(item.unit_price_paise / 100).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-sm font-bold text-content">
                      ₹{(item.line_total_paise / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="p-5 bg-ground/50 border-t border-edge text-sm space-y-2">
              <div className="flex justify-between text-content-muted">
                <span>Subtotal</span>
                <span>₹{(order.subtotal_paise / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-content-muted">
                <span>
                  Shipping ({order.shipping_method || 'Standard'})
                </span>
                <span>₹{(order.shipping_paise / 100).toFixed(2)}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{(order.discount_paise / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-edge flex justify-between font-bold text-base text-content">
                <span>Grand Total</span>
                <span>₹{(order.total_paise / 100).toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-content-muted pt-1">
                * All prices tax-inclusive. Snapshot preserved at time of purchase.
              </p>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-canvas border border-edge rounded-xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-terracotta" />
                <h2 className="font-semibold text-base text-content">Internal Admin Notes</h2>
              </div>
              <span className="text-xs text-content-muted">Only visible to admin</span>
            </div>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="p-4 sm:p-5 border-b border-edge bg-ground/30">
              <label htmlFor="admin-order-note" className="block text-xs font-medium text-content mb-1.5">
                Add Note for this Order
              </label>
              <textarea
                id="admin-order-note"
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Special packing with Fontainhas motif paper requested; verified address with customer."
                className="w-full p-2.5 bg-canvas border border-edge rounded-lg text-sm text-content placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
              />
              {noteError && <p className="text-xs text-rose-600 mt-1">{noteError}</p>}
              <div className="mt-2 text-right">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  <Send className="h-3 w-3" />
                  {submittingNote ? 'Adding...' : 'Post Internal Note'}
                </button>
              </div>
            </form>

            {/* Existing notes list */}
            <div className="divide-y divide-edge">
              {!order.notes || order.notes.length === 0 ? (
                <div className="p-6 text-center text-xs text-content-muted">
                  No internal notes recorded yet.
                </div>
              ) : (
                order.notes.map((n) => (
                  <div key={n.id} className="p-4 text-xs space-y-1">
                    <p className="text-content whitespace-pre-wrap">{n.note}</p>
                    <p className="text-stone-400 text-[10px]">
                      {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Shipping Address */}
        <div className="space-y-6">
          {/* Shipping Address Card */}
          <div className="bg-canvas border border-edge rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-edge">
              <MapPin className="h-4 w-4 text-terracotta" />
              <h2 className="font-semibold text-sm text-content">Delivery Address</h2>
            </div>

            {order.shipping_address ? (
              <div className="text-sm space-y-1 text-content">
                <p className="font-bold text-base">
                  {order.shipping_address.recipient_name || order.shipping_address.name || '—'}
                </p>
                <p className="text-content-muted text-xs">
                  {order.shipping_address.line1 || order.shipping_address.street || ''}
                </p>
                {order.shipping_address.line2 && (
                  <p className="text-content-muted text-xs">{order.shipping_address.line2}</p>
                )}
                <p className="text-content-muted text-xs">
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  <span className="font-mono font-medium text-content">
                    {order.shipping_address.pincode}
                  </span>
                </p>
                {order.shipping_address.phone && (
                  <p className="text-xs text-content-muted pt-2 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-stone-400" />
                    {order.shipping_address.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-content-muted">No address snapshot recorded.</p>
            )}

            <div className="pt-3 border-t border-edge-subtle">
              <div className="text-xs text-content-muted">Shipping Tier:</div>
              <div className="text-xs font-semibold text-content mt-0.5">
                {order.shipping_method === 'goa_express'
                  ? 'Goa Express (403xxx) · ₹80'
                  : 'Pan-India Standard · ₹120'}
              </div>
            </div>
          </div>

          {/* Tracking / Shipments Info Card */}
          <div className="bg-canvas border border-edge rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-edge">
              <Truck className="h-4 w-4 text-terracotta" />
              <h2 className="font-semibold text-sm text-content">Shipment & Courier</h2>
            </div>

            {!order.shipments || order.shipments.length === 0 ? (
              <p className="text-xs text-content-muted">
                No courier tracking recorded yet. Tracking will be attached when status advances to Shipped.
              </p>
            ) : (
              <div className="space-y-3">
                {order.shipments.map((s) => (
                  <div key={s.id} className="p-3 bg-ground rounded-lg border border-edge text-xs space-y-1">
                    <div className="font-semibold text-content">{s.carrier}</div>
                    <div className="text-content-muted">
                      AWB / Tracking:{' '}
                      <span className="font-mono font-medium text-content">
                        {s.awb_or_tracking_number || 'Pending'}
                      </span>
                    </div>
                    {s.tracking_url && (
                      <a
                        href={s.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-terracotta hover:underline pt-1"
                      >
                        Track package <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Transition Confirmation Modal */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-canvas border border-edge rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-xl font-bold text-content">
              Confirm Status Transition: {NEXT_STATUS_MAP[order.status]?.label}
            </h3>
            <p className="text-xs text-content-muted mt-1.5">
              Strict forward-only fulfillment. This update will log an audit event and dispatch an email notification to the customer.
            </p>

            {statusError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {statusError}
              </div>
            )}

            <form onSubmit={handleConfirmTransition} className="mt-4 space-y-4">
              {targetStatus === 'shipped' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. Delhivery Express / BlueDart / Speed Post"
                      className="w-full px-3 py-2 bg-ground border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">
                      AWB / Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DEL-99218204"
                      className="w-full px-3 py-2 bg-ground border border-edge rounded-lg text-sm text-content font-mono focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">
                      Tracking Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://track.delhivery.com/..."
                      className="w-full px-3 py-2 bg-ground border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Transition Note / Customer Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Packed safely with eco-friendly cushioning; ready for courier pickup."
                  className="w-full px-3 py-2 bg-ground border border-edge rounded-lg text-sm text-content focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta"
                />
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-edge text-xs text-stone-600 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Audit row will be recorded with timestamp, old status ({order.status}), new status ({targetStatus}), and your admin IP.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransitionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-edge bg-ground hover:bg-stone-100 text-content text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submittingStatus ? 'Updating...' : `Confirm: Mark as ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
