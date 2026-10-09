import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../lib/data';
import { ShellCockleIcon } from '../common/Icons';

export default function Footer() {
  return (
    <div className="bg-ground px-[clamp(12px,2.5vw,32px)] pb-[clamp(12px,2vw,24px)] pt-1">
      <footer className="relative overflow-clip rounded-2xl bg-palm text-content-ondark palm-shade">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12 max-w-shell relative z-10 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-16">
            {/* Column 1: Brand & Contact Info */}
            <div>
              <Link to="/" className="group flex items-center gap-4" aria-label="Global to Local — home">
                <span
                  aria-hidden="true"
                  className="relative isolate block aspect-square shrink-0 transition-[width,height] duration-300 h-16 w-16"
                >
                  <span className="absolute inset-0 overflow-hidden rounded-full bg-surface ring-1 ring-content-ondark/25 shadow-sm">
                    <img
                      src="/logo.png"
                      alt="Global to Local Logo"
                      loading="lazy"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </span>
                </span>
                <span className="flex flex-col leading-none gap-2">
                  <span className="font-display font-semibold tracking-[-0.01em] text-[1.375rem] text-content-ondark">
                    {siteConfig.name}
                  </span>
                  <span className="font-display italic text-[0.9375rem] text-content-ondark-muted">
                    {siteConfig.tagline}
                  </span>
                </span>
              </Link>

              <p className="mt-8 max-w-sm text-[0.9375rem] leading-relaxed text-content-ondark-muted">
                {siteConfig.description}
              </p>

              <address className="mt-8 space-y-2 text-[0.9375rem] not-italic text-content-ondark-muted">
                <p>{siteConfig.contact.address}</p>
                <p>
                  <a href={siteConfig.contact.phoneHref} className="transition-colors hover:text-content-ondark">
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${siteConfig.contact.supportEmail}`} className="transition-colors hover:text-content-ondark">
                    {siteConfig.contact.supportEmail}
                  </a>
                </p>
                <p className="pt-1 text-sm text-content-ondark-muted/80">
                  {siteConfig.contact.hours}
                </p>
              </address>
            </div>

            {/* Column 2: Explore Navigation */}
            <div>
              <h2 className="text-sm font-semibold tracking-wider uppercase text-content-ondark">Explore</h2>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link to="/our-story" className="text-[0.9375rem] text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="text-[0.9375rem] text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/our-social-corner" className="text-[0.9375rem] text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Our Social Corner
                  </Link>
                </li>
                <li>
                  <Link to="/in-the-news" className="text-[0.9375rem] text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    In the News
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-[0.9375rem] text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Contact Us & FAQs
                  </Link>
                </li>
              </ul>

              <Link
                to="/shop"
                className="group mt-8 inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-content-ondark hover:text-accent transition-colors"
              >
                <ShellCockleIcon className="h-[18px] w-[18px] text-content-ondark/60 group-hover:text-accent transition-colors" />
                <span>All thirteen shelves</span>
                <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {/* Column 3: Policies Navigation */}
            <div>
              <h2 className="text-sm font-semibold tracking-wider uppercase text-content-ondark">Policies</h2>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link to="/shipping-policy" className="text-[0.9375rem] leading-snug text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Shipping policy
                  </Link>
                </li>
                <li>
                  <Link to="/return-and-exchange-policy" className="text-[0.9375rem] leading-snug text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Returns, exchanges and cancellations
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="text-[0.9375rem] leading-snug text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Terms and conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-[0.9375rem] leading-snug text-content-ondark-muted transition-colors duration-200 hover:text-content-ondark">
                    Privacy policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Sub-bar */}
          <div className="mt-14 flex flex-col gap-4 border-t border-border-ondark/30 pt-8 text-sm text-content-ondark-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Global to Local. Made in Goa.</p>
            <p className="text-content-ondark-muted/70">We support livelihoods.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
