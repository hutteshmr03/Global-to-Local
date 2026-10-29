import React, { useEffect, useState } from 'react';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  MapPin,
  RefreshCw,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Customer Detail Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Status toggle confirmation
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());

      const res = await apiFetch(`/api/v1/admin/customers?${params.toString()}`);
      const raw = res.items || [];
      const clean = raw.filter((c) => {
        const name = (c.name || c.full_name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        return (
          !name.includes('maria fernandes') &&
          !name.includes('rahul naik') &&
          !name.includes('sancho fernandes') &&
          !name.includes('pooja naik') &&
          !name.includes('max') &&
          !email.includes('example.com') &&
          !name.includes('gurjeet') &&
          !email.includes('gurjeet') &&
          !name.includes('debarshi') &&
          !name.includes('kunal') &&
          !name.includes('shopper 8288') &&
          !name.includes('test user') &&
          !(name.includes('test') && !name.includes('attest'))
        );
      });
      setCustomers(clean);
      setTotal(clean.length);
    } catch (err) {
      setError(err?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const openCustomerDetail = async (id) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await apiFetch(`/api/v1/admin/customers/${id}`);
      setCustomerDetail(data);
    } catch (err) {
      setDetailError(err?.message || 'Failed to load customer profile.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (customer, newStatus) => {
    if (
      !confirm(
        newStatus
          ? `Reactivate account for ${customer.full_name || customer.email || customer.phone}?`
          : `Deactivate account for ${customer.full_name || customer.email || customer.phone}? This will immediately terminate all active sessions and block sign-in.`
      )
    ) {
      return;
    }

    setTogglingStatus(true);
    try {
      await apiFetch(`/api/v1/admin/customers/${customer.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newStatus }),
      });

      // Update in local lists
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, is_active: newStatus } : c))
      );
      if (customerDetail && customerDetail.id === customer.id) {
        setCustomerDetail((prev) => ({ ...prev, is_active: newStatus }));
      }
    } catch (err) {
      alert(err?.message || 'Failed to update customer status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl text-content font-bold">Customers Directory</h1>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-ground text-content text-sm transition-colors shadow-xs min-h-[44px] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
          <input
            type="text"
            placeholder="Search by customer name, email address, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ground border border-border rounded-xl text-sm text-content placeholder-content-subtle focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to retrieve customer records</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-content">
            Showing <span className="font-bold">{customers.length}</span> of {total} registered users
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-content-muted">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-terracotta" />
            <p className="text-sm">Loading customer database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-content">No customers found</h3>
            <p className="text-sm text-content-muted mt-1 max-w-sm mx-auto">
              {search ? 'No registered customers match your search.' : 'No customer accounts registered yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ground/75 border-b border-border text-xs font-semibold text-content-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Contact Credentials</th>
                    <th className="px-5 py-3.5">Orders Placed</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => {
                    const regDate = c.created_at
                      ? new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={c.id} className="hover:bg-ground/40 transition-colors">
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openCustomerDetail(c.id)}
                            className="font-semibold text-content hover:text-accent text-left transition-colors cursor-pointer"
                          >
                            {c.full_name || 'Guest / Unnamed Customer'}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-xs space-y-1">
                          {c.email ? (
                            <div className="flex items-center gap-1.5 text-content">
                              <Mail className="h-3 w-3 text-content-subtle" />
                              <span>{c.email}</span>
                            </div>
                          ) : null}
                          {c.phone ? (
                            <div className="flex items-center gap-1.5 text-content font-sans">
                              <Phone className="h-3 w-3 text-content-subtle" />
                              <span>{c.phone}</span>
                            </div>
                          ) : null}
                          {!c.email && !c.phone && <span className="text-content-muted">No contact info</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ground text-content text-xs font-medium">
                            <ShoppingBag className="h-3 w-3 text-accent" />
                            {c.order_count} {c.order_count === 1 ? 'order' : 'orders'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {c.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <UserCheck className="h-3 w-3 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                              <UserX className="h-3 w-3 text-rose-600" />
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-content-muted whitespace-nowrap">
                          {regDate}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => openCustomerDetail(c.id)}
                            className="px-3 py-1.5 rounded-lg border border-border bg-ground hover:bg-surface text-content text-xs font-medium transition-colors cursor-pointer min-h-[36px]"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c, !c.is_active)}
                            disabled={togglingStatus}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
                              c.is_active
                                ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {c.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-border/60">
              {customers.map((c) => {
                const regDate = c.created_at
                  ? new Date(c.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          onClick={() => openCustomerDetail(c.id)}
                          className="font-semibold text-content text-sm hover:text-accent text-left transition-colors cursor-pointer"
                        >
                          {c.full_name || 'Guest / Unnamed Customer'}
                        </button>
                        <p className="text-xs text-content-muted mt-0.5">Joined {regDate}</p>
                      </div>
                      <div>
                        {c.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                            <UserX className="h-3 w-3 text-rose-600" />
                            Deactivated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-content-muted">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-content">
                          <Mail className="h-3 w-3 text-content-subtle" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-content font-sans">
                          <Phone className="h-3 w-3 text-content-subtle" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {!c.email && !c.phone && <span>No contact info</span>}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ground border border-border/60 text-content text-xs font-medium">
                        <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                        {c.order_count} {c.order_count === 1 ? 'order' : 'orders'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => openCustomerDetail(c.id)}
                        className="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-ground text-content text-xs font-semibold shadow-xs transition-colors min-h-[44px] cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c, !c.is_active)}
                        disabled={togglingStatus}
                        className={`w-full inline-flex items-center justify-center px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors min-h-[44px] cursor-pointer ${
                          c.is_active
                            ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {c.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <h3 className="font-sans text-xl font-bold text-content">Customer Details</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-content-subtle hover:text-content hover:bg-ground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {detailLoading ? (
                <div className="py-16 text-center text-content-muted">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-accent" />
                  <p className="text-xs">Fetching customer record...</p>
                </div>
              ) : detailError || !customerDetail ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {detailError || 'Customer not found.'}
                </div>
              ) : (
                <>
                  {/* Bio & Status Card */}
                  <div className="p-4 rounded-xl bg-ground border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-sans text-lg font-bold text-content">
                        {customerDetail.full_name || 'Unnamed Customer'}
                      </h4>
                      <div className="text-xs text-content-muted space-y-0.5 mt-1">
                        {customerDetail.email && <p>Email: {customerDetail.email}</p>}
                        {customerDetail.phone && <p>Phone: {customerDetail.phone}</p>}
                        <p>
                          Member since:{' '}
                          {customerDetail.created_at
                            ? new Date(customerDetail.created_at).toLocaleDateString('en-IN', {
                                dateStyle: 'medium',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {customerDetail.is_active ? (
                        <button
                          onClick={() => handleToggleStatus(customerDetail, false)}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          Deactivate & Revoke Sessions
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(customerDetail, true)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <UserCheck className="h-4 w-4" />
                          Reactivate Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Saved Addresses */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-2.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-terracotta" />
                      Saved Delivery Addresses ({customerDetail.addresses?.length || 0})
                    </h5>
                    {!customerDetail.addresses || customerDetail.addresses.length === 0 ? (
                      <p className="text-xs text-stone-400 p-3 bg-ground rounded-lg border border-edge">
                        No saved delivery addresses on file.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customerDetail.addresses.map((a) => (
                          <div
                            key={a.id}
                            className="p-3 bg-ground rounded-lg border border-edge text-xs space-y-1 relative"
                          >
                            {a.is_default && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-terracotta text-white font-medium">
                                Default
                              </span>
                            )}
                            <p className="font-semibold text-content">{a.name}</p>
                            <p className="text-content-muted">{a.street}</p>
                            <p className="text-content-muted">
                              {a.city}, {a.state} - {a.pincode}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Purchase History */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-content-muted mb-2.5 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-terracotta" />
                      Order History ({customerDetail.orders?.length || 0})
                    </h5>
                    {!customerDetail.orders || customerDetail.orders.length === 0 ? (
                      <p className="text-xs text-stone-400 p-3 bg-ground rounded-lg border border-edge">
                        No orders recorded for this customer yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-edge border border-edge rounded-lg overflow-hidden bg-ground">
                        {customerDetail.orders.map((o) => (
                          <div
                            key={o.id}
                            className="p-3 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                          >
                            <div>
                              <span className="font-sans font-bold text-accent mr-2">
                                {o.order_number}
                              </span>
                              <span className="text-content-muted">
                                {o.placed_at
                                  ? new Date(o.placed_at).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '—'}
                              </span>
                              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] border border-edge bg-canvas uppercase">
                                {o.status}
                              </span>
                            </div>
                            <div className="font-semibold text-content">
                              ₹{((o.total_paise || 0) / 100).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-ground/50 text-right">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-5 py-2.5 rounded-xl border border-border bg-surface hover:bg-ground text-content text-sm font-semibold transition-colors min-h-[44px] cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
