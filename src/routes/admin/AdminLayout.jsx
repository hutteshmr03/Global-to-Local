import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    return null;
  }

  // Logged in as customer (not admin) -> 403 Forbidden Screen
  if (user.role !== 'admin') {
    return (
      <main className="min-h-screen bg-ground flex items-center justify-center p-6 text-content">
        <div className="w-full max-w-md rounded-3xl border border-accent/30 bg-surface p-8 shadow-xl text-center space-y-5">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-accent">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">Error 403</span>
            <h1 className="mt-1 font-display text-2xl font-bold text-content">Access Restricted</h1>
            <p className="mt-2 text-sm text-content-muted leading-relaxed">
              This back-office area requires single-administrator privileges. Customer accounts do not have access.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-palm py-3 text-xs font-bold text-white hover:bg-palm-shade transition-all shadow-xs"
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
              className="w-full inline-flex items-center justify-center gap-2 rounded-pill border border-border bg-ground py-2.5 text-xs font-semibold text-content hover:bg-surface transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-accent" />
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
    <div className="min-h-screen bg-ground flex flex-col text-content font-sans">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Brand & Admin Badge */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2.5">
                <span className="font-display text-lg font-bold tracking-tight text-content">
                  Global to Local
                </span>
                <span className="rounded-pill bg-palm/15 border border-palm/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-palm">
                  Admin Back Office
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 rounded-pill px-3.5 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-palm text-white shadow-xs'
                          : 'text-content-muted hover:bg-surface-muted hover:text-content'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Quick Store Link, Admin Email & Sign Out */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-accent transition-colors"
                title="Open Public Customer Storefront in new tab"
              >
                <span>View Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="h-4 w-px bg-border/60" />

              <div className="text-right">
                <p className="text-xs font-bold text-content leading-tight">{user.name || 'Store Admin'}</p>
                <p className="text-[10px] font-medium text-content-subtle truncate max-w-[140px]">{user.email}</p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border bg-ground px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface hover:border-content-subtle transition-all shadow-xs"
                title="Sign out of back office"
              >
                <LogOut className="h-3.5 w-3.5 text-accent" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-border bg-surface text-content hover:bg-surface-muted"
                aria-label="Toggle admin menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-surface p-4 space-y-2 shadow-lg">
            <div className="pb-2 border-b border-border/40">
              <p className="text-xs font-bold text-content">{user.name || 'Store Admin'}</p>
              <p className="text-[11px] text-content-subtle truncate">{user.email}</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-palm text-white'
                          : 'text-content-muted hover:bg-surface-muted hover:text-content'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-content-muted"
              >
                <span>View Store</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Admin Page Content */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
