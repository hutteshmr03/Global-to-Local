import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Globe,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';
import { queryClient } from '../../lib/catalogue-hooks';

const DEFAULT_ARTICLES = [
  {
    id: 'news-1',
    publication: 'The Navhind Times',
    date: 'October 2020',
    title: 'Global to Local supermarket opens in city',
    url: 'https://www.navhindtimes.in/2020/10/28/business/global-to-local-supermarket-opens-in-city/',
  },
  {
    id: 'news-2',
    publication: 'Business Goa',
    date: 'March 2021',
    title: 'Global to Local in Business Goa',
    url: 'https://businessgoa.in/tag/global-to-local/',
  },
  {
    id: 'news-3',
    publication: 'Gomantak Times',
    date: 'August 2022',
    title: 'Global to Local empowers rural Goan women entrepreneurs',
    url: 'https://www.gomantaktimes.com/news/business/global-to-local-empowers-rural-goan-women-entrepreneurs',
  },
  {
    id: 'news-4',
    publication: 'The Goan',
    date: 'February 2025',
    title: 'Feature on Global to Local',
    url: '#',
  },
  {
    id: 'news-5',
    publication: 'Herald',
    date: 'November 2024',
    title: 'Global to Local in the Herald',
    url: '#',
  },
];

export default function AdminNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Article Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Essential Inputs
  const [publication, setPublication] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [url, setUrl] = useState('');

  // Delete Modal State
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/admin/news');
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setArticles(res.items);
      } else {
        setArticles(DEFAULT_ARTICLES);
      }
    } catch (err) {
      // Graceful fallback to default articles
      setArticles(DEFAULT_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedPub = publication.trim();
    const trimmedTitle = title.trim();
    const trimmedDate = date.trim();
    const trimmedUrl = url.trim() || '#';

    if (!trimmedPub) {
      setFormError('Please enter the publication name (e.g. The Navhind Times).');
      return;
    }
    if (!trimmedTitle) {
      setFormError('Please enter the article headline / title.');
      return;
    }
    if (!trimmedDate) {
      setFormError('Please enter the published date (e.g. October 2020 or February 2025).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        publication: trimmedPub,
        title: trimmedTitle,
        date: trimmedDate,
        url: trimmedUrl,
      };

      const created = await apiFetch('/api/v1/admin/news', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const newArticle = created?.id ? created : { ...payload, id: `news-${Date.now()}` };
      setArticles((prev) => [newArticle, ...prev]);
      setShowAddModal(false);
      setPublication('');
      setTitle('');
      setDate('');
      setUrl('');

      // Invalidate live store cache
      try {
        queryClient.invalidateQueries({ queryKey: ['press'] });
      } catch {}

      setSuccessMsg('News article added successfully and published live!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err?.detail || err?.message || 'Failed to add news article. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/news/${articleToDelete.id}`, {
        method: 'DELETE',
      });

      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setArticleToDelete(null);

      // Invalidate live store cache
      try {
        queryClient.invalidateQueries({ queryKey: ['press'] });
      } catch {}

      setSuccessMsg('News article deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.detail || err?.message || 'Failed to delete article.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (a.publication || '').toLowerCase().includes(q) ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.date || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl sm:text-3xl text-content font-bold">In the News Management</h1>
            <span className="inline-flex items-center rounded-full bg-palm/10 text-palm border border-palm/20 px-2.5 py-0.5 text-xs font-bold">
              {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Manage media coverage and publications displayed on the public <span className="font-semibold text-content">/in-the-news</span> page.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchNews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-ground text-content text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[40px]"
            title="Refresh news articles"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setPublication('');
              setTitle('');
              setDate('');
              setUrl('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-palm text-white text-xs font-bold hover:bg-palm-shade transition-colors shadow-sm cursor-pointer min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add News Article</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
          <input
            type="text"
            placeholder="Search by publication, headline, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ground border border-border rounded-xl text-xs sm:text-sm text-content focus:outline-none focus:ring-2 focus:ring-palm/20 focus:border-palm min-h-[42px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content text-xs p-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* News Articles Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-palm border-t-transparent mb-3" />
          <p className="text-xs font-semibold text-content-muted">Loading news articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl space-y-3">
          <Newspaper className="h-10 w-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-semibold text-content">No news articles found</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            {searchTerm ? 'No articles match your search filter.' : 'Click "Add News Article" above to add your first press coverage.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const hasExternalLink = article.url && article.url !== '#';

            return (
              <div
                key={article.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs hover:border-border/80 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Publication Pill + Date + Delete Button */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-pill border border-border/80 bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-content uppercase tracking-wider">
                        {article.publication}
                      </span>
                      {article.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-content-subtle font-medium">
                          <Calendar className="w-3 h-3 text-content-subtle/80" />
                          <span>{article.date}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setArticleToDelete(article)}
                      className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-600"
                      title="Delete this article"
                      aria-label={`Delete ${article.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Article Title */}
                  <h3 className="font-serif text-base sm:text-lg font-bold text-content leading-snug">
                    {article.title}
                  </h3>
                </div>

                {/* Bottom Bar: Link */}
                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  {hasExternalLink ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                    >
                      <span>Read the article</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-content-subtle italic">No external URL provided</span>
                  )}

                  <span className="text-[10px] text-content-subtle font-mono">
                    ID: {article.id.slice(-6)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD NEWS ARTICLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-palm/10 flex items-center justify-center text-palm shrink-0">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-content">Add News Article</h3>
                  <p className="text-xs text-content-muted">Enter essential details to display on /in-the-news</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setShowAddModal(false)}
                disabled={submitting}
                className="p-1 text-content-subtle hover:text-content min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateArticle} className="space-y-4">
              {/* 1. Publication Name */}
              <div>
                <label className="block text-xs font-bold text-content mb-1">
                  Publication Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Navhind Times, Business Goa, Herald"
                  value={publication}
                  onChange={(e) => setPublication(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-ground text-content text-sm focus:outline-none focus:ring-2 focus:ring-palm/20 focus:border-palm"
                />
              </div>

              {/* 2. Article Title */}
              <div>
                <label className="block text-xs font-bold text-content mb-1">
                  Article Headline / Title <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global to Local supermarket opens in city"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-ground text-content text-sm focus:outline-none focus:ring-2 focus:ring-palm/20 focus:border-palm"
                />
              </div>

              {/* 3. Published Date */}
              <div>
                <label className="block text-xs font-bold text-content mb-1">
                  Published Date <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October 2020 or February 2025"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-ground text-content text-sm focus:outline-none focus:ring-2 focus:ring-palm/20 focus:border-palm"
                />
                <p className="text-[11px] text-content-muted mt-1">
                  Enter month and year as you want it shown on the card badge.
                </p>
              </div>

              {/* 4. Article Link (URL) */}
              <div>
                <label className="block text-xs font-bold text-content mb-1">
                  Article Link (URL) <span className="text-content-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://www.navhindtimes.in/... (or leave blank if no online link)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-ground text-content text-sm focus:outline-none focus:ring-2 focus:ring-palm/20 focus:border-palm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-pill border border-border text-xs font-semibold text-content hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-palm text-white text-xs font-bold hover:bg-palm-shade transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Publish Article</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-content">Delete News Article</h3>
                  <p className="text-xs text-content-muted">Remove press coverage from your store</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setArticleToDelete(null)}
                disabled={deleting}
                className="p-1 text-content-subtle hover:text-content min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 space-y-1.5">
              <p className="text-xs text-content leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-rose-950">"{articleToDelete.title}"</span>?
              </p>
              <p className="text-[11px] text-content-muted">
                Publication: <span className="font-semibold text-content">{articleToDelete.publication}</span> &bull; Date: {articleToDelete.date}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                &bull; This article will be permanently removed from the public "In the News" page.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-pill border border-border text-xs font-semibold text-content hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteArticle}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Article</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
