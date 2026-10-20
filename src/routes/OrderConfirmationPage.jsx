import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Printer, Building2, Copy } from 'lucide-react';
import { siteConfig, formatPrice } from '../lib/data';
import { useAuthStore } from '../lib/auth-store';
import { apiFetch } from '../lib/api-client';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const user = useAuthStore(state => state.user);
  const cancelOrder = useAuthStore(state => state.cancelOrder);
  const existingOrder = (user?.orders || []).find(o => o.orderNumber === orderNumber);
  const [order, setOrder] = useState(existingOrder || null);
  const [cancelMsg, setCancelMsg] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    if (orderNumber && user) {
      apiFetch(`/api/v1/orders/${encodeURIComponent(orderNumber)}`)
        .then(data => {
          if (!cancelled && data) {
            setOrder(data);
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [orderNumber, user?.id]);

  const handleCancel = async () => {
    if (!orderNumber) return;
    const res = await cancelOrder(orderNumber);
    if (res.ok && res.order) {
      setOrder(res.order);
      setCancelMsg('Order cancelled.');
    } else {
      setCancelMsg(res.error || 'Please contact the store to cancel.');
    }
  };

  const statusLabel = order?.statusLabel || 'Preparing for dispatch';
  const badgeLabel =
    order?.status === 'pending_payment'
      ? 'Pending Payment'
      : order?.status === 'cancelled'
      ? 'Order Cancelled'
      : 'Payment Confirmed';

  return (
    <main id="main-content" className="pt-24 sm:pt-28 pb-12 sm:pb-16 bg-ground min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Success Icon & Status */}
        <div className="mx-auto flex flex-col items-center justify-center gap-1.5 mb-2">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-palm/15 text-palm ring-6 ring-palm/5">
            <CheckCircle2 className="w-7 h-7 text-palm stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent mt-1">
            Order Confirmed
          </span>
        </div>

        <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-content tracking-tight whitespace-normal sm:whitespace-nowrap">
          Dev Borem Korum! (Thank You)
        </h1>
        <p className="mt-2 text-sm sm:text-base text-content-muted max-w-lg mx-auto leading-relaxed">
          Your order has been received and is being freshly packed at our Fontainhas store.
        </p>

        {/* Order Details Card */}
        <div className="mt-6 rounded-2xl border border-border/50 bg-surface p-5 sm:p-7 text-left shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">Order Reference</p>
              <p className="font-mono text-lg font-bold text-content mt-0.5">{orderNumber}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-palm/10 border border-palm/20 px-3 py-1 text-xs font-bold text-palm">
              {badgeLabel}
            </span>
          </div>

          <div className="text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-content">
              <Package className="w-4 h-4 text-accent shrink-0" />
              <span>Packaging status: <strong className="text-content font-bold">{statusLabel}</strong></span>
            </div>
          </div>

          {order && order.items && order.items.length > 0 && (
            <div className="border-t border-border/30 pt-3.5 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-content font-medium">
                    {item.name} × {item.qty || item.quantity || 1}
                  </span>
                  <span className="font-sans font-bold tabular-nums text-content">
                    {formatPrice((item.price || item.unit_price_paise || 0) * (item.qty || item.quantity || 1))}
                  </span>
                </div>
              ))}

              {/* Delivery / Shipping Fee Row */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-content-muted pt-1">
                <span className="flex items-center gap-1.5">
                  <span>Delivery ({order.shipping_method || (order.shipping_paise === 8000 ? 'Goa Express' : 'Pan-India Standard')})</span>
                </span>
                <span className="font-sans font-semibold tabular-nums text-content">
                  {formatPrice(order.shipping_paise ?? ((order.totalPaise || order.total_paise || 0) - order.items.reduce((acc, it) => acc + ((it.price || it.unit_price_paise || 0) * (it.qty || it.quantity || 1)), 0)))}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border/20 pt-2 text-xs sm:text-sm font-bold text-content">
                <span>Total</span>
                <span className="font-sans text-accent tabular-nums">
                  {formatPrice(order.totalPaise || order.total_paise || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Bank Transfer Payment Instructions Box */}
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Bank Transfer Details</span>
              </div>
              <span className="text-[11px] font-semibold text-content-muted">Bank of India</span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-content-muted">Beneficiary:</span>
                <div className="flex items-center gap-1.5 font-semibold text-content">
                  <span>{siteConfig.contact.bankDetails?.accountName || 'Global To Local'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteConfig.contact.bankDetails?.accountName || 'Global To Local', 'name')}
                    className="p-1 hover:text-accent cursor-pointer"
                    title="Copy Name"
                  >
                    {copiedField === 'name' ? <CheckCircle2 className="w-3.5 h-3.5 text-palm" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

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

              <div className="flex items-center justify-between py-1 border-t border-border/20">
                <span className="text-content-muted">Bank & Branch:</span>
                <span className="font-semibold text-content">
                  {siteConfig.contact.bankDetails?.bankName || 'Bank of India'}, {siteConfig.contact.bankDetails?.branch || 'Miramar'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/30 text-[11px] text-content-muted leading-relaxed">
              💡 Please mention Order Reference <strong className="font-mono text-content">{orderNumber}</strong> in your bank transfer remarks/notes for instant payment matching.
            </div>
          </div>

          {order?.canCancel && (
            <div className="border-t border-border/30 pt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-content-muted">Payment is still pending. You can cancel this order before payment capture.</span>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-pill border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-500/20 cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          )}

          {(cancelMsg || order?.cancelNotice) && (
            <div className="text-xs font-medium text-content-muted">
              {cancelMsg || order?.cancelNotice}
            </div>
          )}

          <div className="border-t border-border/30 pt-3 text-xs text-content-muted leading-relaxed">
            Need to update delivery instructions? Call our store team directly at{' '}
            <a href={siteConfig.contact.phoneHref} className="text-accent font-semibold no-underline hover:text-accent-hover">
              {siteConfig.contact.phoneDisplay}
            </a>.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/shop"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill bg-palm px-8 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-palm-shade shadow-xs transition-all cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => window.print()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill border border-border bg-surface px-6 py-3.5 text-xs sm:text-sm font-semibold text-content hover:bg-surface-muted transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-content-muted" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </main>
  );
}
