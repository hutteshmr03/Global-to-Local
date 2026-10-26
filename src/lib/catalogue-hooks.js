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

export function sortCategoriesCustom(cats) {
  if (!Array.isArray(cats)) return cats;
  const regular = cats.filter((c) => c.slug !== 'kunbi' && c.slug !== 'hand-crafted');
  const kunbi = cats.find((c) => c.slug === 'kunbi');
  const handCrafted = cats.find((c) => c.slug === 'hand-crafted');
  const tail = [kunbi, handCrafted].filter(Boolean);
  return [...regular, ...tail];
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/categories');
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return sortCategoriesCustom(res.items);
        }
        return sortCategoriesCustom(fallbackCategories);
      } catch (err) {
        console.warn('API /api/v1/categories unreachable; using Goan fallback categories:', err);
        return sortCategoriesCustom(fallbackCategories);
      }
    },
    initialData: () => sortCategoriesCustom(fallbackCategories),
    placeholderData: () => sortCategoriesCustom(fallbackCategories),
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      try {
        const items = await fetchAllCatalogueProducts();
        if (items && Array.isArray(items) && items.length > 0) {
          return items.filter((p) => p.is_active !== false && p.status !== 'Hidden' && p.status !== 'Draft');
        }
        return fallbackProducts;
      } catch (err) {
        console.warn('API /api/v1/products unreachable; using Goan fallback products:', err);
        return fallbackProducts;
      }
    },
    initialData: () => fallbackProducts,
    placeholderData: () => fallbackProducts,
    staleTime: 5 * 60 * 1000,
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
        if (res && Array.isArray(res.items)) {
          return res.items.filter((p) => p.is_active !== false && p.status !== 'Hidden' && p.status !== 'Draft');
        }
        return fallback;
      } catch (err) {
        console.warn(`API /api/v1/products?category=${categorySlug} unreachable; using fallback:`, err);
        return fallback;
      }
    },
    initialData: () => fallback,
    placeholderData: () => fallback,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(categorySlug),
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
        if (!res || res.is_active === false || res.status === 'Hidden' || res.status === 'Draft') {
          return null;
        }
        return res;
      } catch (err) {
        // If server explicitly returned 404 (product hidden, deleted, or does not exist),
        // we MUST return null so the customer is NOT shown a hidden product!
        if (err.status === 404) {
          return null;
        }
        // Only if network dropped completely do we use fallback
        if (err.status === 503 || err.name === 'TypeError' || err.message?.includes('unreachable')) {
          return fallback;
        }
        return null;
      }
    },
    enabled: Boolean(slug),
  });
}

export function useCollection(slug, fallbackItems = []) {
  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      try {
        const res = await apiFetch(`/api/v1/collections/${encodeURIComponent(slug)}`);
        if (res && Array.isArray(res.items)) {
          return res.items.filter((p) => p.is_active !== false && p.status !== 'Hidden' && p.status !== 'Draft');
        }
        return fallbackItems;
      } catch {
        return fallbackItems;
      }
    },
    enabled: Boolean(slug),
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

export const PRIMARY_VISITORS_REVIEWS = [
  {
    id: 'rev-001',
    author: 'Gifty Abraham',
    author_name: 'Gifty Abraham',
    name: 'Gifty Abraham',
    role: '',
    location: '',
    stars: 5,
    rating: 5,
    quote:
      'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
    description:
      'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
  },
  {
    id: 'rev-002',
    author: 'Stedwick Fernandes',
    author_name: 'Stedwick Fernandes',
    name: 'Stedwick Fernandes',
    role: '',
    location: '',
    stars: 5,
    rating: 5,
    quote:
      "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
    description:
      "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
  },
  {
    id: 'rev-003',
    author: 'Swapna Pujari',
    author_name: 'Swapna Pujari',
    name: 'Swapna Pujari',
    role: 'SilhouetteIndia',
    location: 'SilhouetteIndia',
    stars: 5,
    rating: 5,
    quote:
      'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
    description:
      'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
  },
];

export function useReviews(source, fallbackList = PRIMARY_VISITORS_REVIEWS) {
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

export function useAdminReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/v1/admin/reviews');
        if (res && Array.isArray(res.items) && res.items.length > 0) {
          return res.items;
        }
        return PRIMARY_VISITORS_REVIEWS;
      } catch {
        return PRIMARY_VISITORS_REVIEWS;
      }
    },
    initialData: PRIMARY_VISITORS_REVIEWS,
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
