import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, Plus } from 'lucide-react';
import { siteConfig } from '../lib/data';
import { useFaqs } from '../lib/catalogue-hooks';
import { apiFetch } from '../lib/api-client';
import StoreBanner from '../components/home/StoreBanner';
import ShellDrift from '../components/common/ShellDrift';

const fallbackFaqs = [
  {
    q: 'Are there any charges for registration?',
    a: 'No, registration on globaltolocal.in is free.'
  },
  {
    q: 'Do I have to necessarily register to shop?',
    a: 'You can browse and add items without registering, but only registered shoppers will be able to checkout and place orders.'
  },
  {
    q: 'Can I have multiple registrations?',
    a: 'Each email address and contact number can only be associated with one globaltolocal account.'
  },
  {
    q: 'Can I add multiple delivery addresses?',
    a: 'Yes, you can save multiple delivery addresses on your globaltolocal account. However, please note that all items placed in a single order can only be delivered to one address.'
  },
  {
    q: 'What is My Account?',
    a: 'My Account is the section you get access to after logging in to globaltolocal.in. It allows you to track your active orders, check your order history, and update contact information.'
  },
  {
    q: 'Are there any additional charges or taxes?',
    a: 'No, the product prices will remain the same. However, delivery cost will be additionally charged.'
  },
  {
    q: 'Is it safe to use my credit or debit card?',
    a: 'Yes, it is safe to use your card on globaltolocal.in.'
  },
  {
    q: 'How long will delivery take?',
    a: 'Once you have placed your order, based on the product selection and location of delivery, you will be given an intimation of the estimated date of delivery.'
  },
  {
    q: 'How are the products delivered?',
    a: 'We are partnered with a courier service.'
  },
  {
    q: 'Is there a minimum order value?',
    a: 'No, there is no minimum order value.'
  },
  {
    q: 'What are the delivery charges?',
    a: 'Standard delivery charges are set based on the weight of the package and the city of delivery.'
  },
  {
    q: 'Is there free shipping above a certain order value?',
    a: 'No, there will not be free shipping on the basis of order value.'
  },
  {
    q: 'How is quality assured?',
    a: 'At the time of delivery, we advise you to kindly check every item as in the invoice.'
  },
  {
    q: 'Do you have offline stores?',
    a: 'Yes, we have a quaint little store situated in the Latin Quarters of Goa, Fontainhas.'
  },
  {
    q: 'Do you take bulk or corporate orders?',
    a: 'Yes, we do bulk orders of products at special prices for institutions such as hotels, corporates, and event management companies.'
  },
  {
    q: 'Where do the products come from?',
    a: 'No, at Global to Local all our products are made in Goa and of Goan origin.'
  },
  {
    q: 'Who makes the products?',
    a: "80% of our products are made by women from self-help groups, we believe in our mantra 'We support livelihoods.'"
  },
  {
    q: 'Do you make gift hampers?',
    a: 'Yes, however this service can only be availed for the state of Goa.'
  },
  {
    q: 'How do I share feedback?',
    a: 'Please feel free to write to us on customerservice@globaltolocal.in'
  }
];

export default function ContactPage() {
  const { data: liveFaqsData } = useFaqs(fallbackFaqs);
  const liveFaqs = liveFaqsData?.length ? liveFaqsData : fallbackFaqs;
  const [openFaq, setOpenFaq] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [enquiryType, setEnquiryType] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('type');
      if (p === 'custom_hamper' || p === 'hamper') return 'custom_hamper';
      if (p === 'bulk_corporate' || p === 'bulk') return 'bulk_corporate';
    }
    return 'general';
  });
  const [message, setMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitStatus(null);
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/v1/enquiries', {
        method: 'POST',
        body: {
          type: enquiryType,
          name: name.trim(),
          email: email.trim(),
          pincode: pincode.trim() || undefined,
          message: message.trim(),
          captcha_token: '1x00000000000000000000AA',
        },
      });
      setSubmitStatus(res.message || 'Thank you! Your enquiry has been received.');
      setName('');
      setEmail('');
      setPincode('');
      setMessage('');
    } catch (err) {
      setSubmitError(err.detail || err.message || 'Unable to submit enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main" className="min-w-0 bg-ground pt-24 sm:pt-28 lg:pt-32 pb-20">
      {/* 1. HERO BANNER SECTION */}
      <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-1">
        <section className="relative isolate overflow-hidden rounded-2xl bg-palm text-content-ondark palm-shade shadow-xl">
          <img
            src="/images/site/fontainhas-dusk.jpg"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 brightness-[0.6] saturate-[1.2]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 film-scrim" />

          {/* Floating Goan botanical motifs */}
          <ShellDrift tone="dark" />

          <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-14 sm:py-18 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-content-ondark [text-shadow:0_1px_18px_rgba(18,38,43,0.35)]">
                Contact Us & FAQs
              </h1>
              <p className="mt-5 text-base sm:text-lg lg:text-xl text-content-ondark-muted leading-relaxed max-w-2xl">
                Come and find us in the Latin Quarters, or open a message in your email app.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* 2. VISIT THE STORE & SEND US A MESSAGE */}
      <section className="py-16 sm:py-20 lg:py-24 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            {/* Left Column: Visit the Store */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-content">
                Visit the store
              </h2>

              <div className="mt-9 space-y-6">
                <div className="border-t border-border/50 pt-5">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-content-subtle">
                    Address
                  </p>
                  <p className="mt-2 text-base sm:text-lg text-content leading-relaxed">
                    Tarcar Mansion, Fontainhas, Panaji, Goa 403001
                  </p>
                </div>

                <div className="border-t border-border/50 pt-5">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-content-subtle">
                    Phone
                  </p>
                  <p className="mt-2 text-base sm:text-lg">
                    <a
                      href="tel:+918010367153"
                      className="font-medium text-content hover:text-accent transition-colors"
                    >
                      +91 80103 67153
                    </a>
                  </p>
                </div>

                <div className="border-t border-border/50 pt-5">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-content-subtle">
                    Email
                  </p>
                  <p className="mt-2 text-base sm:text-lg">
                    <a
                      href="mailto:customerservice@globaltolocal.in"
                      className="font-medium text-content hover:text-accent transition-colors"
                    >
                      customerservice@globaltolocal.in
                    </a>
                  </p>
                </div>

                <div className="border-t border-border/50 pt-5">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-content-subtle">
                    Hours
                  </p>
                  <p className="mt-2 text-base sm:text-lg text-content">
                    Open all through the week, 10 AM to 9 PM
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Send Us a Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface p-7 sm:p-9 shadow-xs"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-content">
                Send us a message
              </h2>

              <div className="mt-6">
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-xs sm:text-sm font-semibold text-content">
                      Name <span className="text-accent">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="h-12 w-full rounded-pill border border-border bg-ground px-4 text-sm text-content transition-colors hover:border-content-subtle focus:border-palm outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-xs sm:text-sm font-semibold text-content">
                      Email <span className="text-accent">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="h-12 w-full rounded-pill border border-border bg-ground px-4 text-sm text-content transition-colors hover:border-content-subtle focus:border-palm outline-none shadow-xs"
                    />
                  </div>

                  {enquiryType === 'custom_hamper' && (
                    <div>
                      <label htmlFor="pincode" className="mb-2 block text-xs sm:text-sm font-semibold text-content">
                        Goa Delivery Pincode <span className="text-accent">*</span>
                      </label>
                      <input
                        id="pincode"
                        type="text"
                        maxLength={6}
                        required
                        value={pincode}
                        onChange={(e) => {
                          if (submitError) setSubmitError('');
                          setPincode(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="403001"
                        className="h-12 w-full rounded-pill border border-border bg-ground px-4 text-sm text-content transition-colors hover:border-content-subtle focus:border-palm outline-none shadow-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="message" className="mb-2 block text-xs sm:text-sm font-semibold text-content">
                      Comment or Message <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => {
                        if (submitError) setSubmitError('');
                        setMessage(e.target.value);
                      }}
                      className="w-full rounded-2xl border border-border bg-ground px-4 py-3 text-sm text-content transition-colors hover:border-content-subtle focus:border-palm outline-none shadow-xs"
                    />
                  </div>

                  {submitError && (
                    <p role="alert" className="text-xs font-medium text-accent">
                      {submitError}
                    </p>
                  )}

                  {submitStatus && (
                    <p role="status" className="text-xs font-semibold text-palm">
                      {submitStatus}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-palm bg-palm px-8 py-3.5 text-sm font-semibold text-content-ondark hover:bg-ink-deep hover:border-ink-deep transition-all duration-200 active:scale-[0.985] shadow-md"
                  >
                    <span>Open in your email app</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. STORE LOCATION BANNER: INSIDE THE FONTAINHAS STORE WITH INTERACTIVE GOOGLE MAP */}
      <section className="relative bg-ground px-5 sm:px-8 lg:px-12 py-4 sm:py-6">
        <div className="mx-auto w-full max-w-shell">
          <div className="relative isolate overflow-hidden rounded-2xl bg-surface border border-edge/40 text-content h-[320px] sm:h-[360px] lg:h-[380px] flex flex-col justify-end shadow-md">
            {/* Background Interactive Google Map - Clean & Bright */}
            <div className="absolute -top-[55px] -bottom-[10px] -left-[10px] -right-[10px] overflow-hidden pointer-events-auto">
              <iframe
                title="Global to Local Store Location, Fontainhas Panaji Goa"
                src="https://maps.google.com/maps?q=Tarcar%20Mansion%2C%20Fontainhas%2C%20Panaji%2C%20Goa%20403001&t=m&z=16&output=embed&iwloc=near"
                className="h-[calc(100%+65px)] w-[calc(100%+20px)] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-label="Google Map showing Global to Local location at Tarcar Mansion, Fontainhas"
              />
            </div>

          {/* Banner Content (Heading in 1 row, Subheading in 1 row, compact glass card) */}
          <div className="relative z-10 p-3 sm:p-4 lg:p-5 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="pointer-events-auto inline-block rounded-xl bg-white/50 backdrop-blur-md px-4 py-2.5 sm:px-5 sm:py-3 border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.06)] max-w-fit"
            >
              <h2 className="font-display text-base sm:text-lg lg:text-xl font-bold leading-snug text-ink-deep whitespace-normal sm:whitespace-nowrap">
                Inside the Fontainhas store
              </h2>
              <p className="mt-1 text-xs sm:text-[13px] font-medium text-ink-deep/80 leading-normal whitespace-normal sm:whitespace-nowrap">
                Tarcar Mansion, Fontainhas, Panaji, Goa 403001. Open all through the week, 10 AM to 9 PM.
              </p>
              <div className="mt-2.5">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Tarcar%20Mansion%2C%20Fontainhas%2C%20Panaji%2C%20Goa%20403001"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-pill bg-[#E5A823] text-content-ondark px-3.5 py-1.5 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-semibold tracking-[-0.01em] hover:brightness-105 transition-all duration-200 active:scale-[0.985] shadow-xs"
                >
                  <MapPin className="h-3 w-3" />
                  <span>Open in Maps</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>

      {/* 4. QUESTIONS WE GET ASKED MOST (19 FAQS ACCORDION) */}
      <section className="py-16 sm:py-20 lg:py-24 bg-ground text-content">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-content">
              Questions we get asked most
            </h2>
            <p className="mt-4 text-base sm:text-lg text-content-muted leading-relaxed">
              Ordering, delivery, gift hampers and where the products come from.
            </p>
          </motion.div>

          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {liveFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div key={idx}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors duration-200 hover:text-accent cursor-pointer group"
                    >
                      <span className="text-base sm:text-[1.0625rem] font-semibold leading-snug text-content group-hover:text-accent">
                        {faq.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-content-subtle transition-transform duration-300 ease-out group-hover:border-accent group-hover:text-accent ${
                          isOpen ? 'rotate-45 bg-accent/10 border-accent text-accent' : ''
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-prose pb-7 pr-10 text-sm sm:text-[0.9375rem] leading-relaxed text-content-muted">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM STORE BANNER */}
      <StoreBanner />
    </main>
  );
}
