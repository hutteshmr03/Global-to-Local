import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Printer } from 'lucide-react';
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
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Success Icon & Status */}
        <div className="mx-auto flex flex-col items-center justify-center gap-2 mb-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-palm/15 text-palm ring-8 ring-palm/5">
            <CheckCircle2 className="w-8 h-8 text-palm stroke-[2.5]" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent mt-2">
            Order Confirmed
          </span>
        </div>

        <h1 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-content tracking-tight whitespace-normal sm:whitespace-nowrap">
          Dev Borem Korum! (Thank You)
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-content-muted max-w-lg mx-auto leading-relaxed">
          Your order has been received and is being freshly packed at our Fontainhas store.
        </p>

        {/* Order Details Card */}
        <div className="mt-8 rounded-2xl border border-border/50 bg-surface p-6 sm:p-8 text-left shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">Order Reference</p>
              <p className="font-mono text-lg font-bold text-content mt-0.5">{orderNumber}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-palm/10 border border-palm/20 px-3 py-1 text-xs font-bold text-palm">
              {badgeLabel}
            </span>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start gap-3 text-content">
              <Package className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Packaging status: <strong className="text-content font-bold">{statusLabel}</strong></span>
            </div>
            <div className="flex items-start gap-3 text-content">
              <Truck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-content-muted">
                Courier tracking link will be sent to your email & SMS.
              </span>
            </div>
          </div>

          {order && order.items && order.items.length > 0 && (
            <div className="border-t border-border/30 pt-4 space-y-2">
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
              <div className="flex items-center justify-between border-t border-border/20 pt-2 text-xs sm:text-sm font-bold text-content">
                <span>Total</span>
                <span className="font-sans text-accent tabular-nums">
                  {formatPrice(order.totalPaise || order.total_paise || 0)}
                </span>
              </div>
            </div>
          )}

          {order?.canCancel && (
            <div className="border-t border-border/30 pt-4 flex items-center justify-between gap-3">
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

          <div className="border-t border-border/30 pt-4 text-xs text-content-muted leading-relaxed">
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
