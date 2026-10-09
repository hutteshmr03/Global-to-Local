import { create } from 'zustand';

const CART_STORAGE_KEY = 'gtl.cart.v1';

export const useCartStore = create((set, get) => ({
  isOpen: false,
  items: (() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })(),

  bumpTrigger: 0,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

  addItem: (product, qty = 1, options = { openDrawer: false }) => {
    const items = get().items;
    const existing = items.find(item => item.product.id === product.id);
    let newItems;
    if (existing) {
      newItems = items.map(item =>
        item.product.id === product.id
          ? { ...item, qty: Math.min(20, item.qty + qty) }
          : item
      );
    } else {
      newItems = [...items, { product, qty: Math.min(20, qty) }];
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    set(state => ({
      items: newItems,
      isOpen: options.openDrawer ? true : state.isOpen,
      bumpTrigger: state.bumpTrigger + 1,
    }));
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map(item =>
      item.product.id === productId ? { ...item, qty: Math.min(20, qty) } : item
    );
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    set({ items: newItems });
  },

  removeItem: (productId) => {
    const newItems = get().items.filter(item => item.product.id !== productId);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    set({ items: newItems });
  },

  clearCart: () => {
    localStorage.removeItem(CART_STORAGE_KEY);
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },

  getSubtotalPaise: () => {
    return get().items.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  },
}));
