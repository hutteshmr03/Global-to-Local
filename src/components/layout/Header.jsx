import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { useCartStore } from '../../lib/cart-store';
import { siteConfig } from '../../lib/data';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Shop', href: '/shop' },
  { label: 'In the News', href: '/in-the-news' },
  { label: 'Our Social Corner', href: '/our-social-corner' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isHome = pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalItems = useCartStore(state => state.getTotalItems());
  const openCart = useCartStore(state => state.openCart);
  const bumpTrigger = useCartStore(state => state.bumpTrigger);
  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    if (bumpTrigger > 0) {
      // Delay slightly so the bounce happens when the flying particle lands
      const timer = setTimeout(() => {
        setIsBumping(true);
        setTimeout(() => setIsBumping(false), 600);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [bumpTrigger]);

  // Floating pill animation state
  const navContainerRef = useRef(null);
  const linkRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const activeIndex = navLinks.findIndex(l => (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)));
  const highlightedIdx = hoveredIdx !== null ? hoveredIdx : activeIndex;

  const updatePill = useCallback(() => {
    const el = highlightedIdx >= 0 ? linkRefs.current[highlightedIdx] : null;
    if (el) {
      setPillStyle({
        x: el.offsetLeft,
        w: el.offsetWidth,
      });
    } else {
      setPillStyle(null);
    }
  }, [highlightedIdx]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const el = navContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updatePill);
    ro.observe(el);
    if (document.fonts?.ready) {
      document.fonts.ready.then(updatePill).catch(() => {});
    }
    return () => ro.disconnect();
  }, [updatePill]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Dark header over home video when not scrolled; clean light header on subpages or when scrolled
  const isTransparentOnVideo = isHome && !isScrolled;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-palm focus:text-white focus:rounded-pill focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          isTransparentOnVideo
            ? 'bg-transparent py-5'
            : 'bg-ground/95 backdrop-blur-md border-b border-border/50 py-3.5 shadow-xs'
        }`}
      >
        <div className="mx-auto flex max-w-shell items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-95"
            aria-label="Global to Local — home"
          >
            <div className="relative isolate block aspect-square shrink-0 h-11 w-11">
              <div className="absolute inset-0 overflow-hidden rounded-full bg-surface ring-1 ring-content-ondark/25 p-0.5">
                <img
                  src="/logo.png"
                  alt="Global to Local Logo"
                  className="h-full w-full rounded-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col leading-none gap-0.5 hidden sm:flex">
              <span
                className={`font-display font-semibold tracking-[-0.01em] text-[0.9375rem] transition-colors ${
                  isTransparentOnVideo ? 'text-content-ondark' : 'text-content'
                }`}
              >
                Global to Local
              </span>
              <span
                className={`font-display italic text-[0.75rem] transition-colors ${
                  isTransparentOnVideo ? 'text-content-ondark-muted' : 'text-content-muted'
                }`}
              >
                It's all about Goa
              </span>
            </div>
          </Link>

          {/* Center: Animated Floating Pill Navbar (Desktop) - Centered in navbar */}
          <nav
            ref={navContainerRef}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`relative hidden lg:flex items-center gap-1 rounded-pill border px-2 py-1 transition-colors ${
              isTransparentOnVideo
                ? 'border-content-ondark/25 bg-ink-deep/25 backdrop-blur-sm'
                : 'border-border/60 bg-surface/90 backdrop-blur-md text-content shadow-xs'
            }`}
            aria-label="Primary"
          >
            {/* Sliding Pill Indicator */}
            {pillStyle && (
              <motion.span
                aria-hidden="true"
                className={`absolute inset-y-1 left-0 z-0 rounded-pill ${
                  isTransparentOnVideo ? 'bg-content-ondark/20' : 'bg-surface-muted'
                }`}
                initial={false}
                animate={{ x: pillStyle.x, width: pillStyle.w }}
                transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.5 }}
              />
            )}

            {navLinks.map((link, idx) => {
              const isActive = idx === activeIndex;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  ref={el => (linkRefs.current[idx] = el)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  className={`relative z-10 whitespace-nowrap rounded-pill px-3 py-1.5 text-[0.9375rem] transition-colors duration-200 ease-out ${
                    isTransparentOnVideo
                      ? isActive
                        ? 'text-content-ondark font-semibold'
                        : 'text-content-ondark-muted hover:text-content-ondark'
                      : isActive
                      ? 'text-accent font-semibold'
                      : 'text-content-muted hover:text-content'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Shop Pill Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`grid h-10 w-10 sm:h-11 sm:w-11 cursor-pointer place-items-center rounded-pill border transition-colors ${
                isTransparentOnVideo
                  ? 'border-content-ondark/30 text-content-ondark hover:bg-content-ondark/10'
                  : 'border-border/50 text-content bg-surface hover:bg-surface-muted shadow-xs'
              }`}
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bag Button */}
            <motion.button
              id="header-bag-btn"
              onClick={openCart}
              animate={isBumping ? {
                scale: [1, 1.35, 0.88, 1.15, 1],
                rotate: [0, -10, 10, -5, 0],
              } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`relative grid h-10 w-10 sm:h-11 sm:w-11 cursor-pointer place-items-center rounded-pill border transition-colors ${
                isTransparentOnVideo
                  ? 'border-content-ondark/30 text-content-ondark hover:bg-content-ondark/10'
                  : 'border-border/60 bg-surface text-content hover:bg-surface-muted shadow-xs'
              }`}
              aria-label={`Open bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.6, y: -4 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-xs"
                >
                  {totalItems}
                </motion.span>
              )}
            </motion.button>

            {/* Shop CTA Button */}
            <div className="hidden sm:block">
              <Link
                to="/shop"
                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border font-sans font-medium tracking-[-0.01em] transition-colors duration-200 ease-out active:scale-[0.985] h-10 sm:h-11 min-w-11 px-5 text-sm ${
                  isTransparentOnVideo
                    ? 'border-content-ondark bg-content-ondark text-palm hover:bg-surface hover:border-surface hover:text-ink-deep shadow-sm'
                    : 'border-palm bg-palm text-white hover:bg-palm-shade shadow-sm'
                }`}
              >
                Shop
              </Link>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`grid h-10 w-10 sm:h-11 sm:w-11 cursor-pointer place-items-center rounded-pill border lg:hidden transition-colors ${
                isTransparentOnVideo
                  ? 'border-content-ondark/30 text-content-ondark hover:bg-content-ondark/10'
                  : 'border-border text-content hover:bg-surface-muted'
              }`}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`border-t px-5 py-3 shadow-xl sm:px-8 ${
                isTransparentOnVideo ? 'border-white/10 bg-ink-deep/95 text-white' : 'border-border/40 bg-surface text-content'
              }`}
            >
              <form onSubmit={handleSearchSubmit} className="mx-auto max-w-shell flex items-center gap-3">
                <Search className={`w-5 h-5 shrink-0 ${isTransparentOnVideo ? 'text-white/60' : 'text-content-muted'}`} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search over 230 Goan products (e.g. bebinca, cafreal, kunbi, cashews)..."
                  className={`w-full bg-transparent text-sm outline-none font-sans ${
                    isTransparentOnVideo ? 'text-white placeholder-white/50' : 'text-content placeholder-content-muted'
                  }`}
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-pill bg-accent px-5 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover transition-colors shrink-0"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className={`text-xs shrink-0 ml-1 ${isTransparentOnVideo ? 'text-white/60 hover:text-white' : 'text-content-muted hover:text-content'}`}
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className={`border-t px-5 py-6 shadow-2xl lg:hidden overflow-hidden ${
                isTransparentOnVideo ? 'border-white/10 bg-ink-deep/95 text-white' : 'border-border/40 bg-ground text-content'
              }`}
            >
              <nav className="flex flex-col gap-3">
                {navLinks.map((link) => {
                  const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-base font-medium transition-colors ${
                        isActive
                          ? isTransparentOnVideo ? 'bg-white/15 text-white font-semibold' : 'bg-surface-muted text-accent font-semibold'
                          : isTransparentOnVideo ? 'text-white/80 hover:bg-white/5' : 'text-content-muted hover:bg-surface'
                      }`}
                    >
                      <span>{link.label}</span>
                      {isActive && <span className="text-accent text-xs">●</span>}
                    </Link>
                  );
                })}
                <Link
                  to="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-3 flex w-full items-center justify-center rounded-pill bg-palm py-3 text-sm font-bold text-white hover:bg-palm-shade"
                >
                  Shop the Shelves
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
