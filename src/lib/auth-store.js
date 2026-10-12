import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'gtl.customer.auth.v1';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Clean out any legacy mock demo address
      if (parsed?.addresses?.some(a => a.id === 'addr_1' || a.street?.includes('Near St. Sebastian Chapel'))) {
        parsed.addresses = (parsed.addresses || []).filter(
          a => !(a.id === 'addr_1' || a.street?.includes('Near St. Sebastian Chapel'))
        );
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  })(),

  login: (userData) => {
    const user = {
      id: userData.id || 'cust_' + Date.now().toString(36),
      name: userData.name || 'Goan Foodie',
      email: userData.email || '',
      phone: userData.phone || '',
      avatar: userData.avatar || '',
      addresses: userData.addresses || [],
      orders: userData.orders || [],
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    set({ user });
    return user;
  },

  logout: () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    set({ user: null });
  },

  addOrder: (orderData) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const existingOrders = currentUser.orders || [];
    const updatedOrders = [orderData, ...existingOrders];
    const updated = { ...currentUser, orders: updatedOrders };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ user: updated });
    return updated;
  },

  updateProfile: (updatedData) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedData };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    set({ user: updated });
  },

  isAuthenticated: () => {
    return Boolean(get().user);
  },
}));
