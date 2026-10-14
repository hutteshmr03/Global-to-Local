import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MessageSquare,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export default function AdminLayout() {
  const { user, isInitialized, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically close mobile menu on ANY route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // If auth is still checking
  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-ground flex items-center justify-center p-6 text-content">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-palm border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-content-muted">Verifying administrator session...</p>
        </div>
      </main>
    );
  }

  // Not logged in -> redirect to /login
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Logged in as customer (not admin) -> 403 Forbidden Screen
  if (user.role !== 'admin') {
    return (
      <main className="admin-scope min-h-screen bg-ground flex items-center justify-center p-6 text-content font-sans">
        <div className="w-full max-w-md rounded-3xl border border-accent/30 bg-surface p-8 shadow-xl text-center space-y-5">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-accent">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Error 403</span>
            <h1 className="mt-1 font-sans text-2xl font-bold text-content">Access Restricted</h1>
            <p className="mt-2 text-sm text-content-muted leading-relaxed">
              This back-office area requires single-administrator privileges. Customer accounts do not have access.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-palm py-3 text-xs font-bold text-white hover:bg-palm-shade transition-all shadow-xs min-h-[44px]"
            >
              <Store className="w-4 h-4" />
              <span>Back to Public Store</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-pill border border-border bg-ground py-2.5 text-xs font-semibold text-content hover:bg-surface transition-all min-h-[44px]"
            >
              <LogOut className="h-3.5 w-3.5 text-accent" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products & Pricing', icon: Package },
    { to: '/admin/orders', label: 'Orders & Tracking', icon: ShoppingBag },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/enquiries', label: 'Enquiries Inbox', icon: MessageSquare },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-scope min-h-screen bg-ground flex flex-col text-content font-sans overflow-x-clip">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
            {/* Left: Brand Logo Symbol & Admin Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/admin"
                className="flex items-center group focus:outline-none"
                aria-label="Admin Dashboard"
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="h-10 w-10 rounded-full border border-border/40 p-0.5 shadow-xs transition-transform duration-300 group-hover:scale-105 overflow-hidden flex items-center justify-center bg-surface">
                    <img
                      src="/logo.png"
                      alt="Global to Local Logo"
                      className="h-full w-full rounded-full object-contain"
                    />
                  </div>
                </div>
              </Link>
              <span className="rounded-pill bg-palm/10 border border-palm/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-palm whitespace-nowrap shrink-0">
                Admin Office
              </span>
            </div>

            {/* Desktop Navigation Links: Pill-Style Container (>= 1024px) */}
            <nav
              className="relative hidden lg:flex items-center gap-1 rounded-pill border border-border/60 bg-surface/90 backdrop-blur-md text-content shadow-xs px-2 py-1 shrink-0"
              aria-label="Admin Navigation"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-palm text-white shadow-xs'
                          : 'text-content-muted hover:text-content hover:bg-surface-muted'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: View Store & Sign Out (>= 1024px) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold text-content-muted hover:text-content hover:bg-surface-muted transition-colors whitespace-nowrap"
                title="Open Public Customer Storefront in new tab"
              >
                <span>View Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="h-4 w-px bg-border/60" />

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border bg-ground px-3.5 py-1.5 text-xs font-semibold text-content hover:bg-surface hover:border-content-subtle transition-all shadow-xs whitespace-nowrap min-h-[36px]"
                title="Sign out of admin office"
              >
                <LogOut className="h-3.5 w-3.5 text-accent" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile / Tablet Hamburger Button (< 1024px) */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl border border-border bg-surface text-content hover:bg-surface-muted min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Toggle admin menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer (< 1024px) matching customer mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="admin-mobile-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-border/50 bg-ground px-5 py-6 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="pb-4 mb-3 border-b border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-content">{user.name || 'Store Admin'}</p>
                  <p className="text-xs font-medium text-content-subtle truncate">{user.email}</p>
                </div>
                <span className="rounded-pill bg-palm/10 border border-palm/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-palm">
                  Admin
                </span>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-surface-muted text-palm font-bold shadow-xs'
                          : 'text-content-muted hover:bg-surface hover:text-content'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {isActive && <span className="text-palm text-xs">●</span>}
                    </NavLink>
                  );
                })}

                <div className="pt-3 mt-2 border-t border-border/40 flex flex-col gap-2.5">
                  <Link
                    to="/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-content-muted hover:bg-surface transition-colors min-h-[44px]"
                  >
                    <span>View Store</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-pill bg-palm py-3 text-sm font-bold text-white hover:bg-palm-shade transition-colors min-h-[44px] cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Admin Page Content: Shared Uniform Container for ALL admin pages */}
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
