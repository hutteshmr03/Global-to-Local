import React from 'react';
import { useQuery, QueryClient } from '@tanstack/react-query';
import { apiFetch, fetchAllCatalogueProducts } from './api-client';
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  reviews as fallbackReviews,
  siteConfig as fallbackSiteConfig,
  makerSteps as fallbackMakerSteps,
  videos as fallbackVideos,
} from './data';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/categories');
      return res.items || fallbackCategories;
    },
    placeholderData: fallbackCategories,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: fetchAllCatalogueProducts,
    placeholderData: fallbackProducts,
  });
}

export function useCategoryProducts(categorySlug) {
  const fallback = React.useMemo(
    () => fallbackProducts.filter((p) => p.categorySlug === categorySlug),
    [categorySlug]
  );
  return useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/products?category=${encodeURIComponent(categorySlug)}&page_size=60`);
      return res.items || [];
    },
    enabled: Boolean(categorySlug),
    placeholderData: fallback,
  });
}

export function useProductDetail(slug) {
  const fallback = React.useMemo(() => {
    const prod = fallbackProducts.find((p) => p.slug === slug);
    if (!prod) return null;
    const related = fallbackProducts
      .filter((p) => p.categorySlug === prod.categorySlug && p.id !== prod.id)
      .slice(0, 4);
    return { ...prod, related_products: related };
  }, [slug]);

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      return await apiFetch(`/api/v1/products/${encodeURIComponent(slug)}`);
    },
    enabled: Boolean(slug),
    placeholderData: fallback,
  });
}

export function useCollection(slug, fallbackItems = []) {
  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/collections/${encodeURIComponent(slug)}`);
      return res.items || [];
    },
    enabled: Boolean(slug),
    placeholderData: fallbackItems,
  });
}

export function useFaqs(fallbackFaqs = []) {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/faqs');
      return res.items || fallbackFaqs;
    },
    placeholderData: fallbackFaqs,
  });
}

export function useReviews(source, fallbackList = fallbackReviews) {
  return useQuery({
    queryKey: ['reviews', source || 'all'],
    queryFn: async () => {
      const url = source
        ? `/api/v1/reviews?source=${encodeURIComponent(source)}`
        : '/api/v1/reviews';
      const res = await apiFetch(url);
      return res.items || fallbackList;
    },
    placeholderData: fallbackList,
  });
}

export function usePress(fallbackData = { articles: [], awards: [] }) {
  return useQuery({
    queryKey: ['press'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/press');
      return {
        articles: res.articles || fallbackData.articles,
        awards: res.awards || fallbackData.awards,
      };
    },
    placeholderData: fallbackData,
  });
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      return await apiFetch('/api/v1/settings/public');
    },
    placeholderData: {
      siteConfig: fallbackSiteConfig,
      makerSteps: fallbackMakerSteps,
      videos: fallbackVideos,
    },
  });
}

export function useSearchSuggestions(query) {
  const clean = (query || '').trim();
  return useQuery({
    queryKey: ['search', 'suggest', clean],
    queryFn: async () => {
      return await apiFetch(`/api/v1/search/suggest?q=${encodeURIComponent(clean)}&limit=8`);
    },
    enabled: clean.length >= 2,
  });
}

export function ProductGridSkeleton({ count = 8 }) {
  return React.createElement(
    'div',
    { className: 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 sm:gap-6' },
    Array.from({ length: count }).map((_, idx) =>
      React.createElement(
        'div',
        {
          key: idx,
          className: 'overflow-hidden rounded-2xl border border-border/40 bg-surface p-3 shadow-xs animate-pulse',
        },
        React.createElement('div', { className: 'aspect-square w-full rounded-xl bg-surface-muted' }),
        React.createElement('div', { className: 'mt-3 h-4 w-3/4 rounded bg-surface-muted' }),
        React.createElement('div', { className: 'mt-2 h-3 w-1/2 rounded bg-surface-muted' }),
        React.createElement('div', { className: 'mt-4 h-8 w-full rounded-pill bg-surface-muted' })
      )
    )
  );
}
