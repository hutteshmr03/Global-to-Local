import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, Truck, ArrowRight, Printer } from 'lucide-react';
import { siteConfig } from '../lib/data';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();

  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-2xl px-5 sm:px-8 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-palm/10 text-palm mb-6">
          <CheckCircle2 className="w-10 h-10 text-palm" />
        </div>

        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
          Order Confirmed
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-content">
          Dev Borem Korum! (Thank You)
        </h1>
        <p className="mt-3 text-base text-content-muted">
          Your order has been received and is being freshly packed at our Fontainhas store.
        </p>

        {/* Order Details Card */}
        <div className="mt-8 rounded-2xl border border-border/40 bg-surface p-8 text-left shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-border/20 pb-4">
            <div>
              <p className="text-xs text-content-muted">Order Reference</p>
              <p className="font-mono text-lg font-bold text-palm">{orderNumber}</p>
            </div>
            <span className="rounded-full bg-palm/10 px-3 py-1 text-xs font-semibold text-palm">
              Payment Confirmed
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-content">
              <Package className="w-4 h-4 text-accent shrink-0" />
              <span>Packaging status: <strong>Preparing for dispatch</strong></span>
            </div>
            <div className="flex items-center gap-3 text-content">
              <Truck className="w-4 h-4 text-accent shrink-0" />
              <span>Courier tracking link will be sent to your email & SMS within 24 hours.</span>
            </div>
          </div>

          <div className="border-t border-border/20 pt-4 text-xs text-content-muted">
            Need to update delivery instructions? Call our store team directly at{' '}
            <a href={siteConfig.contact.phoneHref} className="text-accent font-semibold underline">
              {siteConfig.contact.phoneDisplay}
            </a>.
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/shop"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill bg-palm px-8 py-3 text-sm font-semibold text-white hover:bg-palm-shade transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => window.print()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-pill border border-border bg-surface px-6 py-3 text-sm font-semibold text-content hover:bg-surface-muted transition-colors"
          >
            <Printer className="w-4 h-4 text-content-muted" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </main>
  );
}
