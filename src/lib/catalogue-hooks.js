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
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/categories');
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return fallbackCategories;
      } catch (err) {
        console.warn('API /api/v1/categories unreachable; using Goan fallback categories:', err);
        return fallbackCategories;
      }
    },
    initialData: fallbackCategories,
    placeholderData: fallbackCategories,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      try {
        const items = await fetchAllCatalogueProducts();
        if (items && Array.isArray(items) && items.length > 0) {
          return items;
        }
        return fallbackProducts;
      } catch (err) {
        console.warn('API /api/v1/products unreachable; using Goan fallback products:', err);
        return fallbackProducts;
      }
    },
    initialData: fallbackProducts,
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
      try {
        const res = await apiFetch(`/api/v1/products?category=${encodeURIComponent(categorySlug)}&page_size=60`);
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return fallback;
      } catch (err) {
        console.warn(`API /api/v1/products?category=${categorySlug} unreachable; using fallback:`, err);
        return fallback;
      }
    },
    enabled: Boolean(categorySlug),
    initialData: fallback,
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
      try {
        const res = await apiFetch(`/api/v1/products/${encodeURIComponent(slug)}`);
        return res || fallback;
      } catch (err) {
        console.warn(`API /api/v1/products/${slug} unreachable; using fallback:`, err);
        return fallback;
      }
    },
    enabled: Boolean(slug),
    initialData: fallback,
    placeholderData: fallback,
  });
}

export function useCollection(slug, fallbackItems = []) {
  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      try {
        const res = await apiFetch(`/api/v1/collections/${encodeURIComponent(slug)}`);
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return fallbackItems;
      } catch {
        return fallbackItems;
      }
    },
    enabled: Boolean(slug),
    initialData: fallbackItems,
    placeholderData: fallbackItems,
  });
}

export function useFaqs(fallbackFaqs = []) {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/faqs');
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return fallbackFaqs;
      } catch {
        return fallbackFaqs;
      }
    },
    initialData: fallbackFaqs,
    placeholderData: fallbackFaqs,
  });
}

export function useReviews(source, fallbackList = fallbackReviews) {
  return useQuery({
    queryKey: ['reviews', source || 'all'],
    queryFn: async () => {
      try {
        const url = source
          ? `/api/v1/reviews?source=${encodeURIComponent(source)}`
          : '/api/v1/reviews';
        const res = await apiFetch(url);
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return fallbackList;
      } catch {
        return fallbackList;
      }
    },
    initialData: fallbackList,
    placeholderData: fallbackList,
  });
}

export function usePress(fallbackData = { articles: [], awards: [] }) {
  return useQuery({
    queryKey: ['press'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/press');
        return {
          articles: res.articles || fallbackData.articles,
          awards: res.awards || fallbackData.awards,
        };
      } catch {
        return fallbackData;
      }
    },
    initialData: fallbackData,
    placeholderData: fallbackData,
  });
}

export function usePublicSettings() {
  const fallback = {
    siteConfig: fallbackSiteConfig,
    makerSteps: fallbackMakerSteps,
    videos: fallbackVideos,
  };
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/settings/public');
        return res || fallback;
      } catch {
        return fallback;
      }
    },
    initialData: fallback,
    placeholderData: fallback,
  });
}

export function useSearchSuggestions(query) {
  const clean = (query || '').trim();
  return useQuery({
    queryKey: ['search', 'suggest', clean],
    queryFn: async () => {
      try {
        return await apiFetch(`/api/v1/search/suggest?q=${encodeURIComponent(clean)}&limit=8`);
      } catch {
        const q = clean.toLowerCase();
        return fallbackProducts
          .filter((p) => p.name.toLowerCase().includes(q) || (p.shortDescription || '').toLowerCase().includes(q))
          .slice(0, 8)
          .map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category_slug: p.categorySlug,
            price_paise: p.price,
            image_url: p.imageSrc,
          }));
      }
    },
    enabled: clean.length >= 2,
  });
}

export function ProductGridSkeleton({ count = 8 }) {
  return React.createElement(
    'div',
    { className: 'mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 sm:gap-6' },
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
