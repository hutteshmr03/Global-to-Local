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
  AlertCircle,
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
    if (e && e.preventDefault) e.preventDefault();
    setSubmittingStatus(true);
    setStatusError('');

    try {
      await apiFetch(`/api/v1/admin/orders/${order.id || order.order_number}/status`, {
        method: 'PATCH',
        body: {
          new_status: targetStatus,
          status: targetStatus,
          carrier: targetStatus === 'shipped' ? (carrier || 'Delhivery Express') : undefined,
          tracking_number: targetStatus === 'shipped' ? (trackingNumber || undefined) : undefined,
          tracking_url: targetStatus === 'shipped' ? (trackingUrl || undefined) : undefined,
          note: statusNote || undefined,
        },
      });

      setIsTransitionModalOpen(false);
      await fetchOrderDetail();
    } catch (err) {
      setStatusError(err?.detail || err?.message || 'Failed to update order status.');
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
        <Package className="h-8 w-8 animate-spin mx-auto mb-3 text-accent" />
        <p className="text-sm">Retrieving order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
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
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm text-content-muted hover:text-content transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>

      {/* Order Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-content">{order.order_number}</h1>
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
            <div className="font-sans text-2xl sm:text-3xl text-content font-extrabold tracking-tight tabular-nums">
              ₹{((order.total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-content-muted">
              Tax inclusive
            </div>
          </div>
        </div>

        {/* Forward-only progression ribbon */}
        <div className="mt-6 pt-5 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Fulfillment Progression (Strict Forward Only)
            </div>
            {nextTransition && (
              <span className="text-xs font-bold text-[#C45C4A]">
                Next Action Required: {nextTransition.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'paid', label: '1. Paid', desc: 'Verified & Confirmed' },
              { key: 'packed', label: '2. Packed', desc: 'Gathered in Box' },
              { key: 'shipped', label: '3. Shipped', desc: 'Handed to Courier' },
              { key: 'delivered', label: '4. Delivered', desc: 'Customer Received' },
            ].map((step) => {
              const orderSteps = ['paid', 'packed', 'shipped', 'delivered'];
              const currentIdx = orderSteps.indexOf(order.status);
              const stepIdx = orderSteps.indexOf(step.key);
              const isCompleted = currentIdx !== -1 && stepIdx <= currentIdx;
              const isNext = nextTransition && nextTransition.next === step.key;
              const isUpcoming = !isCompleted && !isNext;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border text-left text-xs transition-all min-h-[110px] ${
                    isNext
                      ? 'border-[#C45C4A] bg-white shadow-xs ring-1 ring-[#C45C4A]/25'
                      : isCompleted
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                      : 'border-border/60 bg-ground/40 text-content-muted opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${isNext ? 'text-content font-bold' : isCompleted ? 'text-emerald-900' : 'text-content-muted'}`}>
                        {step.label}
                      </span>
                      {isCompleted && (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {isNext && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#C45C4A]/10 text-[10px] font-bold text-[#C45C4A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C45C4A] animate-pulse" />
                          Next
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-[10px] text-content-subtle">Upcoming</span>
                      )}
                    </div>
                    <div className={`text-[11px] mt-1 ${isCompleted ? 'text-emerald-700/80' : isNext ? 'text-content-muted' : 'text-content-subtle'}`}>
                      {step.desc}
                    </div>
                  </div>

                  <div className="mt-3">
                    {isNext && (
                      <button
                        type="button"
                        onClick={() => handleOpenTransitionModal(nextTransition.next)}
                        className="w-full py-2 px-3 rounded-xl bg-[#C45C4A] hover:bg-[#B04F3E] text-white text-xs font-bold text-center transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <nextTransition.icon className="h-3.5 w-3.5" />
                        <span>{nextTransition.label} &rarr;</span>
                      </button>
                    )}
                    {isCompleted && (
                      <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <span>✓ Status Verified</span>
                      </div>
                    )}
                    {isUpcoming && (
                      <div className="text-[11px] text-content-subtle">
                        <span>Pending prior step</span>
                      </div>
                    )}
                  </div>
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
          <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-base text-content">Items in Order ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-border/60">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
                  <img
                    src={item.image_url || '/images/catalog/goan-themed-blue-mug.jpg'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-ground border border-border shrink-0"
                    onError={(e) => {
                      e.target.src = '/images/catalog/goan-themed-blue-mug.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-content truncate">{item.name}</h3>
                    <p className="text-xs text-content-muted mt-0.5">
                      SKU: <span className="font-sans font-semibold text-content">{item.sku}</span> {item.unit_label ? `• ${item.unit_label}` : ''}
                    </p>
                    <p className="text-xs text-content-muted mt-1">
                      ₹{((item.unit_price_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-sm font-bold text-content">
                      ₹{((item.line_total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="p-5 bg-ground/40 border-t border-border text-sm space-y-2">
              <div className="flex justify-between text-content-muted">
                <span>Subtotal</span>
                <span>₹{((order.subtotal_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-content-muted">
                <span>
                  Shipping ({order.shipping_method || 'Standard'})
                </span>
                <span>₹{((order.shipping_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{((order.discount_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border flex justify-between font-bold text-base text-content">
                <span>Grand Total</span>
                <span>₹{((order.total_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[11px] text-content-muted pt-1">
                * All prices tax-inclusive. Snapshot preserved at time of purchase.
              </p>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <h2 className="font-semibold text-base text-content">Internal Admin Notes</h2>
              </div>
              <span className="text-xs text-content-muted">Only visible to admin</span>
            </div>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="p-4 sm:p-5 border-b border-border bg-ground/40">
              <label htmlFor="admin-order-note" className="block text-xs font-medium text-content mb-1.5">
                Add Note for this Order
              </label>
              <textarea
                id="admin-order-note"
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Special packing with Fontainhas motif paper requested; verified address with customer."
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-content placeholder-content-subtle focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              {noteError && <p className="text-xs text-rose-600 mt-1">{noteError}</p>}
              <div className="mt-2 text-right">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-palm hover:bg-palm-shade disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  {submittingNote ? 'Adding...' : 'Post Internal Note'}
                </button>
              </div>
            </form>

            {/* Existing notes list */}
            <div className="divide-y divide-border/60">
              {!order.notes || order.notes.length === 0 ? (
                <div className="p-6 text-center text-xs text-content-muted">
                  No internal notes recorded yet.
                </div>
              ) : (
                order.notes.map((n) => (
                  <div key={n.id} className="p-4 text-xs space-y-1">
                    <p className="text-content whitespace-pre-wrap">{n.note}</p>
                    <p className="text-content-subtle text-[10px]">
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
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <MapPin className="h-4 w-4 text-accent" />
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
                  <span className="font-sans font-semibold text-content">
                    {order.shipping_address.pincode}
                  </span>
                </p>
                {order.shipping_address.phone && (
                  <p className="text-xs text-content-muted pt-2 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-content-subtle" />
                    {order.shipping_address.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-content-muted">No address snapshot recorded.</p>
            )}

            <div className="pt-3 border-t border-border-subtle">
              <div className="text-xs text-content-muted">Shipping Tier:</div>
              <div className="text-xs font-semibold text-content mt-0.5">
                {(() => {
                  const isGoa =
                    order.shipping_method?.toLowerCase().includes('goa') ||
                    String(order.shipping_address?.pincode || '').startsWith('403');
                  const fee = order.shipping_paise != null
                    ? `₹${((order.shipping_paise || 0) / 100).toLocaleString('en-IN')}`
                    : (isGoa ? '₹80' : '₹120');
                  return isGoa ? `Goa Express (403xxx) · ${fee}` : `Pan-India Standard · ${fee}`;
                })()}
              </div>
            </div>
          </div>

          {/* Tracking / Shipments Info Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Truck className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-sm text-content">Shipment & Courier</h2>
            </div>

            {!order.shipments || order.shipments.length === 0 ? (
              <p className="text-xs text-content-muted">
                No courier tracking recorded yet. Tracking will be attached when status advances to Shipped.
              </p>
            ) : (
              <div className="space-y-3">
                {order.shipments.map((s) => (
                  <div key={s.id} className="p-3 bg-ground/50 rounded-xl border border-border text-xs space-y-1">
                    <div className="font-semibold text-content">{s.carrier}</div>
                    <div className="text-content-muted">
                      AWB / Tracking:{' '}
                      <span className="font-sans font-semibold text-content">
                        {s.awb_or_tracking_number || 'Pending'}
                      </span>
                    </div>
                    {s.tracking_url && (
                      <a
                        href={s.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline pt-1"
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

      {/* Direct Confirmation Modal: Are you sure to mark as... Yes or No */}
      {isTransitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-center max-h-[90vh] overflow-y-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#C45C4A]/10 text-[#C45C4A] flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-sans text-xl font-bold text-content">
                Are you sure to mark as {targetStatus ? targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1) : ''}?
              </h3>
              <p className="text-xs text-content-muted mt-1.5">
                Order <span className="font-sans font-bold text-content">{order.order_number}</span>
              </p>
            </div>

            {statusError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left">
                {statusError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                disabled={submittingStatus}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface hover:bg-ground text-content text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={submittingStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C45C4A] hover:bg-[#B04F3E] text-white text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {submittingStatus ? 'Updating...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
