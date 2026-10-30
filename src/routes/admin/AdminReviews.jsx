import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  MessageSquareQuote,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';
import { queryClient } from '../../lib/catalogue-hooks';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Review Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Requested inputs: Stars, Discreption, Name (+ optional Location/Role)
  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/admin/reviews');
      if (res && Array.isArray(res.items)) {
        setReviews(res.items);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setFormError('Please enter the customer name.');
      return;
    }
    if (!trimmedDesc) {
      setFormError('Please enter the review discreption.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        stars: Number(stars) || 5,
        description: trimmedDesc,
        location: location.trim() || undefined,
      };

      const created = await apiFetch('/api/v1/admin/reviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!created || !created.id) {
        throw new Error('Server did not return a valid review ID.');
      }

      // Prepend the new review immediately
      setReviews((prev) => [created, ...prev]);
      setShowAddModal(false);
      setName('');
      setDescription('');
      setLocation('');
      setStars(5);

      // Invalidate customer reviews cache so home & social corner update immediately!
      try {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      } catch {}

      setSuccessMsg('Review added successfully and published to live website!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setFormError(err?.detail || err?.message || 'Failed to add review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/reviews/${encodeURIComponent(deletingId)}`, {
        method: 'DELETE',
      });
      setReviews((prev) => prev.filter((r) => r.id !== deletingId));
      setDeletingId(null);
      try {
        queryClient.invalidateQueries({ queryKey: ['reviews'] });
      } catch {}
      setSuccessMsg('Review deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to delete review.');
      setDeletingId(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const q = searchTerm.toLowerCase();
    const rName = (r.name || r.author_name || r.author || '').toLowerCase();
    const rDesc = (r.description || r.quote || '').toLowerCase();
    const rLoc = (r.location || r.author_location || r.role || '').toLowerCase();
    return rName.includes(q) || rDesc.includes(q) || rLoc.includes(q);
  });

  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, r) => sum + Number(r.stars || r.rating || 5), 0) /
        reviews.length
      ).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-content">
              Customer Reviews
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-palm/10 px-2.5 py-0.5 text-xs font-semibold text-palm">
              <Sparkles className="h-3 w-3" />
              Live Feed
            </span>
          </div>
          <p className="mt-1 text-sm text-content-muted">
            Manage customer testimonials displayed on the homepage and "Our Social Corner" (Visitors' Book).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-content hover:bg-surface-muted transition-colors disabled:opacity-50"
            title="Refresh Reviews"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-palm px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-palm/90 active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Review
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchReviews}
            className="inline-flex items-center gap-1.5 rounded-pill bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1 text-xs font-semibold transition-colors shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">
            Total Reviews
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-content">
              {reviews.length}
            </span>
            <span className="text-xs text-content-muted">active testimonials</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">
            Average Rating
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-3xl font-bold text-content">
              {avgRating}
            </span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-content-subtle">
            Live Visibility
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Visible to all online visitors</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reviews by name or text..."
            className="w-full rounded-xl border border-border bg-ground py-2 pl-9 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-palm focus:outline-none focus:ring-1 focus:ring-palm"
          />
        </div>
        <div className="text-xs text-content-muted font-medium">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* 4. Reviews List */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-palm" />
          <p className="mt-3 text-sm text-content-muted">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-xs">
          <MessageSquareQuote className="h-10 w-10 text-content-subtle" />
          <h3 className="mt-3 font-display text-base font-semibold text-content">
            No reviews found
          </h3>
          <p className="mt-1 text-sm text-content-muted">
            {searchTerm
              ? 'No reviews match your search query.'
              : 'Add your first review to display on the storefront.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((rev) => {
            const revStars = Math.max(1, Math.min(5, Number(rev.stars || rev.rating || 5)));
            const revName = rev.name || rev.author_name || rev.author || 'Customer';
            const revDesc = rev.description || rev.quote || '';
            const revLoc = rev.location || rev.author_location || rev.role || '';

            return (
              <div
                key={rev.id}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all hover:shadow-md hover:border-palm/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-400" title={`${revStars} Stars`}>
                      {[...Array(revStars)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                      <span className="ml-1 text-xs font-bold text-content-muted">
                        ({revStars}/5)
                      </span>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={() => setDeletingId(rev.id)}
                      className="rounded-lg p-1.5 text-content-subtle hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Discreption / Quote */}
                  <blockquote className="mt-4 text-sm leading-relaxed text-content-muted line-clamp-4">
                    “{revDesc}”
                  </blockquote>
                </div>

                {/* Name & Subtitle */}
                <div className="mt-6 border-t border-border/40 pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-sm font-bold text-content">
                      {revName}
                    </h4>
                    {revLoc && (
                      <p className="text-xs text-content-subtle">
                        {revLoc}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-ground px-2 py-0.5 text-[10px] font-semibold text-content-subtle border border-border">
                    {rev.source || "Visitors' Book"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD REVIEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-content">
                  Add New Review
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Input customer Stars, Discreption, and Name to display live on the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-content-subtle hover:bg-surface-muted hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateReview} className="mt-5 space-y-4">
              {/* INPUT 1: Stars */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content">
                  Stars <span className="text-rose-500">*</span>
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const isActive = starIdx <= (hoveredStar || stars);
                      return (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => setStars(starIdx)}
                          onMouseEnter={() => setHoveredStar(starIdx)}
                          onMouseLeave={() => setHoveredStar(0)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                          title={`${starIdx} Stars`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              isActive
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-border hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                    {stars} {stars === 1 ? 'Star' : 'Stars'}
                  </span>
                </div>
              </div>

              {/* INPUT 2: Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Fernandes or Dr. Anand Naik"
                  className="mt-1.5 w-full rounded-xl border border-border bg-ground px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:border-palm focus:outline-none focus:ring-1 focus:ring-palm"
                />
              </div>

              {/* INPUT 3: Discreption */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content">
                  Discreption <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write customer review / discreption here... (e.g. Authentic Goan taste, wonderful packaging and courteous staff!)"
                  className="mt-1.5 w-full rounded-xl border border-border bg-ground px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:border-palm focus:outline-none focus:ring-1 focus:ring-palm leading-relaxed"
                />
              </div>

              {/* OPTIONAL: Location / Role */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Role / Location <span className="text-xs lowercase text-content-subtle">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Panaji, Goa or SilhouetteIndia"
                  className="mt-1.5 w-full rounded-xl border border-border bg-ground px-3.5 py-2.5 text-sm text-content placeholder:text-content-subtle focus:border-palm focus:outline-none focus:ring-1 focus:ring-palm"
                />
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-content hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-palm px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-palm/90 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? 'Adding...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-content">
                  Delete Review?
                </h3>
                <p className="mt-0.5 text-xs text-content-muted">
                  This will remove the review from the storefront and customer views.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-colors"
              >
                Keep Review
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {deleting && <RefreshCw className="h-3 w-3 animate-spin" />}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
