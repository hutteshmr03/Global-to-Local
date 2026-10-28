import { create } from 'zustand';
import { apiFetch } from './api-client';

const GUEST_CART_STORAGE_KEY = 'gtl.cart.v1';
const pendingUpdateTimers = new Map();

function mapServerCartToStoreItems(serverCart) {
  if (!serverCart || !Array.isArray(serverCart.items)) return [];
  return serverCart.items.map((ci) => ({
    itemId: ci.item_id,
    qty: ci.quantity,
    product: {
      id: ci.legacy_id ?? ci.id,
      uuid: ci.product_id,
      slug: ci.slug,
      name: ci.name,
      price: ci.unit_price_paise,
      weight: ci.unit_label,
      imageSrc: ci.image_url || ci.imageSrc,
      imageAlt: ci.imageAlt || ci.name,
      categorySlug: ci.categorySlug || '',
      inStock: ci.inStock ?? true,
      availableQuantity: ci.available_quantity ?? 50,
    },
  }));
}

function mergeStoreItemsWithServer(localItems, serverItems) {
  if (!serverItems || !Array.isArray(serverItems) || serverItems.length === 0) {
    return localItems;
  }
  const merged = [...serverItems];
  for (const local of localItems) {
    const exists = merged.some(
      (m) =>
        (m.product?.id && m.product.id === local.product?.id) ||
        (m.product?.slug && m.product.slug === local.product?.slug)
    );
    if (!exists) {
      merged.push(local);
    }
  }
  return merged;
}

function loadGuestItems() {
  try {
    const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveGuestItems(items, isLoggedIn) {
  try {
    if (isLoggedIn) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // ignore storage errors
  }
}

export const useCartStore = create((set, get) => ({
  isOpen: false,
  isLoggedIn: false,
  items: loadGuestItems(),
  bumpTrigger: 0,
  cartError: null,

  clearCartError: () => set({ cartError: null }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  setFromServerCart: (serverCart, isLoggedIn = true) => {
    const mapped = mapServerCartToStoreItems(serverCart);
    if (isLoggedIn) {
      try {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } catch {}
      set({ items: mapped, isLoggedIn: true, cartError: null });
    } else {
      const current = get().items;
      const merged = mergeStoreItemsWithServer(current, mapped);
      saveGuestItems(merged, false);
      set({ items: merged, isLoggedIn: false, cartError: null });
    }
  },

  hydrateCart: async (isLoggedIn = false) => {
    set({ isLoggedIn });
    if (!isLoggedIn) {
      const localItems = loadGuestItems();
      set({ items: localItems });
      return;
    }
    try {
      const serverCart = await apiFetch('/api/v1/cart');
      get().setFromServerCart(serverCart, true);
    } catch {
      set({ cartError: 'Something went wrong. Please try again.' });
    }
  },

  getGuestItemsPayload: () => {
    return get().items.map((item) => ({
      product_id: item.product.id,
      slug: item.product.slug,
      quantity: item.qty,
    }));
  },

  addItem: async (product, qty = 1, options = { openDrawer: false }) => {
    if (!product || product.is_active === false || product.status === 'Hidden' || product.status === 'Draft') {
      set({ cartError: 'This product is currently unavailable.' });
      return;
    }

    if (product.inStock === false || product.availability === 'out_of_stock' || (product.available_quantity !== undefined && product.available_quantity <= 0) || (product.stock_qty !== undefined && product.stock_qty <= 0)) {
      set({ cartError: 'This product is currently out of stock.' });
      return;
    }

    const prevItems = get().items;
    const isLoggedIn = get().isLoggedIn;
    const existing = prevItems.find(
      (item) => item.product.id === product.id || item.product.slug === product.slug
    );
    const desiredTotal = (existing ? existing.qty : 0) + qty;

    if (desiredTotal > 20) {
      set({ cartError: 'Maximum 20 pieces per item allowed in your cart.' });
      return;
    }

    // Optimistic update (preserves instant FlyToCart & stepper feel)
    let optimisticItems;
    if (existing) {
      optimisticItems = prevItems.map((item) =>
        item.product.id === product.id || item.product.slug === product.slug
          ? { ...item, qty: Math.min(20, item.qty + qty) }
          : item
      );
    } else {
      optimisticItems = [...prevItems, { product, qty: Math.min(20, qty) }];
    }

    saveGuestItems(optimisticItems, isLoggedIn);
    set((state) => ({
      items: optimisticItems,
      isOpen: options.openDrawer ? true : state.isOpen,
      bumpTrigger: state.bumpTrigger + 1,
      cartError: null,
    }));

    try {
      const serverCart = await apiFetch('/api/v1/cart/items', {
        method: 'POST',
        body: {
          product_id: product.id ?? product.slug,
          quantity: qty,
        },
      });
      if (serverCart) {
        get().setFromServerCart(serverCart, isLoggedIn);
      }
    } catch (err) {
      console.warn('Cart add notice:', err?.message || err);
    }
  },

  updateQty: async (productId, qty) => {
    if (qty <= 0) {
      return get().removeItem(productId);
    }
    if (qty > 20) {
      set({ cartError: 'Maximum 20 pieces per item allowed in your cart.' });
      return;
    }

    const prevItems = get().items;
    const isLoggedIn = get().isLoggedIn;
    const optimisticItems = prevItems.map((item) =>
      item.product.id === productId || item.product.slug === productId
        ? { ...item, qty: Math.min(20, qty) }
        : item
    );

    saveGuestItems(optimisticItems, isLoggedIn);
    set({ items: optimisticItems, cartError: null });

    // Cancel any pending debounce timer for this product
    if (pendingUpdateTimers.has(productId)) {
      clearTimeout(pendingUpdateTimers.get(productId));
    }

    // Debounce server call by 350ms so rapid clicks don\'t fight or arrive out of order
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        pendingUpdateTimers.delete(productId);
        try {
          const serverCart = await apiFetch(`/api/v1/cart/items/${encodeURIComponent(productId)}`, {
            method: 'PATCH',
            body: { quantity: qty },
          });
          if (serverCart) {
            get().setFromServerCart(serverCart, isLoggedIn);
          }
          resolve({ ok: true });
        } catch (err) {
          console.warn('Cart update notice:', err?.message || err);
          resolve({ ok: false });
        }
      }, 350);

      pendingUpdateTimers.set(productId, timer);
    });
  },

  removeItem: async (productId) => {
    if (pendingUpdateTimers.has(productId)) {
      clearTimeout(pendingUpdateTimers.get(productId));
      pendingUpdateTimers.delete(productId);
    }

    const prevItems = get().items;
    const isLoggedIn = get().isLoggedIn;
    const optimisticItems = prevItems.filter(
      (item) => item.product.id !== productId && item.product.slug !== productId
    );

    saveGuestItems(optimisticItems, isLoggedIn);
    set({ items: optimisticItems, cartError: null });

    try {
      const serverCart = await apiFetch(`/api/v1/cart/items/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      if (serverCart) {
        const mapped = mapServerCartToStoreItems(serverCart);
        saveGuestItems(mapped, isLoggedIn);
        set({ items: mapped, cartError: null });
      }
    } catch (err) {
      console.warn('Remove item notice:', err?.message || err);
    }
  },

  clearCart: async () => {
    try {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ items: [], cartError: null });
    try {
      await apiFetch('/api/v1/cart', { method: 'DELETE' });
    } catch {
      // ignore
    }
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotalPaise: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  },
}));
