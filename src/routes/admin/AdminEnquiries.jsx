import React, { useEffect, useState } from 'react';
import {
  Inbox,
  Mail,
  Phone,
  MapPin,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Package,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed_won', label: 'Closed (Won)' },
  { value: 'closed_lost', label: 'Closed (Lost)' },
];

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'contact', label: 'General Inquiry' },
  { value: 'bulk', label: 'Bulk Corporate' },
  { value: 'hamper', label: 'Custom Hamper' },
];

function getEnquiryTypeLabel(type) {
  switch (type) {
    case 'bulk':
      return 'Bulk Corporate';
    case 'hamper':
    case 'custom_hamper':
      return 'Custom Hamper';
    case 'contact':
    case 'general':
      return 'General Inquiry';
    default:
      return type ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Enquiry';
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'bulk':
      return <Package className="h-4 w-4 text-amber-600" />;
    case 'hamper':
    case 'custom_hamper':
      return <Gift className="h-4 w-4 text-emerald-600" />;
    case 'contact':
    default:
      return <HelpCircle className="h-4 w-4 text-sky-600" />;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'new':
      return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    case 'in_progress':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'quoted':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'closed_won':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
    case 'closed_lost':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    default:
      return 'bg-stone-50 text-stone-700 border-stone-200';
  }
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Status updating state per enquiry
  const [updatingId, setUpdatingId] = useState(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

      const res = await apiFetch(`/api/v1/admin/enquiries?${params.toString()}`);
      setEnquiries(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err?.message || 'Failed to load customer enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter, typeFilter]);

  const handleStatusChange = async (enquiryId, newStatus) => {
    setUpdatingId(enquiryId);
    try {
      await apiFetch(`/api/v1/admin/enquiries/${enquiryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      alert(err?.message || 'Failed to update enquiry status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl text-content font-bold">Enquiries & Leads</h1>
        </div>
        <button
          onClick={fetchEnquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-ground text-content text-sm transition-colors shadow-xs min-h-[44px] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-content-subtle shrink-0" />
          <span className="text-xs font-semibold text-content uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3.5 py-2.5 bg-ground border border-border rounded-xl text-sm text-content focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent min-h-[44px] cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-content uppercase tracking-wider">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-48 px-3.5 py-2.5 bg-ground border border-border rounded-xl text-sm text-content focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent min-h-[44px] cursor-pointer"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load enquiries</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Enquiries Feed / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-content-muted bg-surface border border-border rounded-2xl">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-accent" />
            <p className="text-sm">Loading enquiries feed...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border rounded-2xl">
            <Inbox className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-content">No enquiries found</h3>
            <p className="text-sm text-content-muted mt-1 max-w-sm mx-auto">
              No enquiries match the selected filters.
            </p>
          </div>
        ) : (
          enquiries.map((item) => {
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : '—';

            return (
              <div
                key={item.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-3 hover:border-border/80 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-ground border border-border">
                      {getTypeIcon(item.type)}
                    </span>
                    <div>
                      <span className="font-semibold text-sm text-content">
                        {getEnquiryTypeLabel(item.type)}
                      </span>
                      <span className="text-xs text-content-muted ml-2">• {dateStr}</span>
                    </div>
                  </div>

                  {/* Status Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-content-muted">Status:</span>
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs px-3 py-1.5 rounded-full border focus:outline-none focus:ring-1 focus:ring-accent min-h-[36px] cursor-pointer ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="quoted">Quoted</option>
                      <option value="closed_won">Closed (Won)</option>
                      <option value="closed_lost">Closed (Lost)</option>
                    </select>
                  </div>
                </div>

                {/* Sender Details */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-content">
                  <div className="font-bold text-sm font-sans">{item.name}</div>
                  {item.email && (
                    <div className="flex items-center gap-1.5 text-content-muted">
                      <Mail className="h-3 w-3 text-content-subtle" />
                      <a href={`mailto:${item.email}`} className="hover:underline text-content">
                        {item.email}
                      </a>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-1.5 text-content-muted font-sans">
                      <Phone className="h-3 w-3 text-content-subtle" />
                      <a href={`tel:${item.phone}`} className="hover:underline text-content">
                        {item.phone}
                      </a>
                    </div>
                  )}
                  {item.pincode && (
                    <div className="flex items-center gap-1.5 text-content-muted">
                      <MapPin className="h-3 w-3 text-content-subtle" />
                      <span>Pincode: {item.pincode}</span>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="p-3 bg-ground rounded-xl border border-border text-xs text-content leading-relaxed whitespace-pre-wrap">
                  {item.message || 'No additional message text provided.'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
