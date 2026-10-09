import React from 'react';
import { useLocation } from 'react-router-dom';

const policyData = {
  '/shipping-policy': {
    title: 'Shipping & Delivery Policy',
    tag: 'Fulfillment & Rates',
    content: [
      {
        heading: 'Pan-India Delivery',
        body: 'We dispatch packages to all postal pincodes across India from our heritage store at Tarcar Mansion, Fontainhas, Panaji, Goa 403001.'
      },
      {
        heading: 'Dispatch Timeline',
        body: 'All orders are carefully packed in protective packaging and dispatched within 24 to 48 hours of order confirmation. You will receive an SMS and email notification with your live courier tracking link.'
      },
      {
        heading: 'Delivery Estimates',
        body: '• Within Goa: 1–2 business days\n• Major Metros (Mumbai, Bengaluru, Delhi, Hyderabad, Chennai, Kolkata): 3–5 business days\n• Rest of India: 4–7 business days'
      },
      {
        heading: 'Shipping Charges',
        body: 'Delivery charges are calculated based on the destination pincode and total package weight slab according to courier partner rate cards. All rates are shown transparently before payment.'
      }
    ]
  },
  '/return-and-exchange-policy': {
    title: 'Return & Exchange Policy',
    tag: 'Quality Guarantee',
    content: [
      {
        heading: 'Perishable Goods & Food Safety',
        body: 'Due to the consumable nature of spices, bakery products, masalas, oils, and handmade soaps, we do not accept general returns once a package has been opened.'
      },
      {
        heading: 'Damaged or Defective Items',
        body: 'If your item arrives damaged in transit, leaking, defective, or expired, please email us at customerservice@globaltolocal.in or call +91 80103 67153 within 48 hours of delivery with photos of the damaged shipment.'
      },
      {
        heading: 'Refund Process',
        body: 'Approved refunds are processed back to the original payment method via Razorpay within 3–5 business days.'
      }
    ]
  },
  '/terms-and-conditions': {
    title: 'Terms & Conditions',
    tag: 'Legal Agreement',
    content: [
      {
        heading: 'Use of the Site',
        body: 'By accessing and ordering from Global to Local, you agree to comply with and be bound by these terms and conditions.'
      },
      {
        heading: 'Pricing & Taxes',
        body: 'All prices listed on the site are in Indian Rupees (INR) and are inclusive of all applicable Goods and Services Taxes (GST).'
      },
      {
        heading: 'Order Acceptance',
        body: 'We reserve the right to refuse or cancel any order in the event of product unavailability or pricing inaccuracies, in which case any charged amount will be fully refunded.'
      }
    ]
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    tag: 'Data Protection (DPDP Compliant)',
    content: [
      {
        heading: 'Information We Collect',
        body: 'We collect your name, delivery address, email, and phone number solely to process and deliver your orders and send tracking updates.'
      },
      {
        heading: 'Payment Information Security',
        body: 'We do not store your credit card, debit card, or UPI credentials. All transactions are securely processed through Razorpay with 256-bit encryption.'
      },
      {
        heading: 'Your Rights',
        body: 'In accordance with India’s Digital Personal Data Protection (DPDP) Act, you have the right to request access to or deletion of your personal account data at any time by contacting our support team.'
      }
    ]
  }
};

export default function PoliciesPage() {
  const { pathname } = useLocation();
  const policy = policyData[pathname] || policyData['/shipping-policy'];

  return (
    <main id="main-content" className="pt-28 sm:pt-32 lg:pt-36 pb-20 bg-ground min-h-screen">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
          {policy.tag}
        </span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-content">
          {policy.title}
        </h1>
        <p className="mt-2 text-xs text-content-muted">
          Last updated: October 2026 · Global to Local, Panaji, Goa
        </p>

        <div className="mt-10 space-y-8 text-base text-content leading-relaxed">
          {policy.content.map((sec, idx) => (
            <div key={idx} className="rounded-2xl border border-border/30 bg-surface p-8 shadow-xs">
              <h2 className="font-display text-xl font-bold text-palm">
                {sec.heading}
              </h2>
              <p className="mt-3 text-sm text-content-muted whitespace-pre-line leading-relaxed">
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
