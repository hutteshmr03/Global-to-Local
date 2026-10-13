import { create } from 'zustand';
import { apiFetch, setClientAuthTokens } from './api-client';
import { useCartStore } from './cart-store';

// Rule 2: Delete any legacy fake localStorage customer registry or order storage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('gtl.customer.registry.v1');
    window.localStorage.removeItem('gtl.customer.auth.v1');
  }
} catch {
  // ignore
}

function mapServerOrderToUiOrder(order) {
  const placedDate = order.placed_at
    ? new Date(order.placed_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const addr = order.shipping_address || order.address || {};

  return {
    id: order.order_number || order.id,
    uuid: order.uuid,
    orderNumber: order.order_number || order.id,
    date: placedDate,
    status: order.status || 'pending_payment',
    canCancel: Boolean(order.can_cancel),
    cancelNotice: order.cancel_notice || null,
    subtotalPaise: order.subtotal_paise ?? order.subtotal ?? 0,
    shippingCostPaise: order.shipping_paise ?? order.shipping ?? 0,
    totalPaise: order.total_paise ?? order.total ?? 0,
    shippingMethod: order.shipping_method || 'Standard Delivery',
    items: (order.items || []).map((item) => ({
      id: item.product_id || item.id,
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      price: item.unit_price_paise ?? item.price ?? 0,
      weight: item.unit_label || item.weight || '',
      qty: item.quantity ?? item.qty ?? 1,
      imageSrc: item.image_url || item.imageSrc || '',
    })),
    address: {
      fullName: addr.recipient_name || addr.name || addr.fullName || '',
      name: addr.recipient_name || addr.name || addr.fullName || '',
      phone: addr.phone || '',
      line1: addr.line1 || addr.street || '',
      street: addr.line1 || addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    },
    statusEvents: order.status_events || [],
    shipments: order.shipments || [],
    payment: order.payment || null,
  };
}

function mapServerUserToUiUser(u, addresses = [], orders = []) {
  if (!u) return null;
  const rawPhone = u.phone || '';
  const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
  return {
    id: u.id,
    name: u.full_name || u.name || 'Shopper',
    full_name: u.full_name || u.name || 'Shopper',
    email: u.email || '',
    phone: cleanDigits ? `+91 ${cleanDigits}` : rawPhone,
    rawPhone: cleanDigits,
    role: u.role || 'customer',
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label || 'Home',
      name: a.recipient_name || a.name || '',
      recipient_name: a.recipient_name || a.name || '',
      phone: a.phone || '',
      street: a.line1 || a.street || '',
      line1: a.line1 || a.street || '',
      line2: a.line2 || '',
      landmark: a.landmark || '',
      city: a.city || '',
      state: a.state || 'Goa',
      pincode: a.pincode || '',
      isDefault: Boolean(a.is_default ?? a.isDefault),
    })),
    orders: orders.map(mapServerOrderToUiOrder),
  };
}

export const useAuthStore = create((set, get) => ({
  user: null,
  isHydrating: true,
  isInitialized: false,

  fetchMe: async () => {
    return await get().hydrateSession();
  },

  hydrateSession: async () => {
    set({ isHydrating: true });
    try {
      const me = await apiFetch('/api/v1/me');
      let ordersList = [];
      try {
        const ordersRes = await apiFetch('/api/v1/orders');
        ordersList = ordersRes.items || [];
      } catch {
        ordersList = [];
      }
      const uiUser = mapServerUserToUiUser(me, me.addresses || [], ordersList);
      set({ user: uiUser, isHydrating: false, isInitialized: true });
      await useCartStore.getState().hydrateCart(true);
      return uiUser;
    } catch {
      set({ user: null, isHydrating: false, isInitialized: true });
      await useCartStore.getState().hydrateCart(false);
      return null;
    }
  },

  requestOtp: async ({ phone, mode = 'login', name, email }) => {
    try {
      const res = await apiFetch('/api/v1/auth/otp/request', {
        method: 'POST',
        body: {
          phone,
          mode: mode === 'signup' ? 'register' : 'login',
          name: name || undefined,
          email: email || undefined,
        },
      });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to send OTP.' };
    }
  },

  verifyOtp: async ({ phone, otp, mode = 'login', name, email }) => {
    try {
      const guestItems = useCartStore.getState().getGuestItemsPayload();
      const res = await apiFetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        body: {
          phone,
          otp,
          mode: mode === 'signup' ? 'register' : 'login',
          name: name || undefined,
          email: email || undefined,
          guest_items: guestItems,
        },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || mapServerUserToUiUser(res.user) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid or expired verification code.' };
    }
  },

  registerUser: async (userData) => {
    try {
      const guestItems = useCartStore.getState().getGuestItemsPayload();
      const res = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: {
          name: userData.name?.trim(),
          email: userData.email?.trim(),
          password: userData.password || 'GoaHeritage!2026',
          phone: userData.phone || undefined,
          guest_items: guestItems,
        },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || mapServerUserToUiUser(res.user) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to create account.' };
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      const guestItems = useCartStore.getState().getGuestItemsPayload();
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: email.trim(),
          password,
          guest_items: guestItems,
        },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || mapServerUserToUiUser(res.user) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid email address or password.' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await apiFetch('/api/v1/auth/password/forgot', {
        method: 'POST',
        body: { email: email.trim() },
      });
      return { ok: true, message: res.message };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to process request.' };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const res = await apiFetch('/api/v1/auth/password/reset', {
        method: 'POST',
        body: { token, new_password: newPassword },
      });
      return { ok: true, message: res.message };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid or expired reset link.' };
    }
  },

  updateProfile: async (updatedData) => {
    const currentUser = get().user;
    if (!currentUser) return { ok: false };

    try {
      const res = await apiFetch('/api/v1/me', {
        method: 'PATCH',
        body: {
          full_name: updatedData.name ?? updatedData.full_name,
          email: updatedData.email || undefined,
          phone: updatedData.phone || undefined,
        },
      });
      const currentOrders = currentUser.orders || [];
      const uiUser = mapServerUserToUiUser(res, res.addresses || [], []);
      uiUser.orders = currentOrders;
      set({ user: uiUser });
      return { ok: true, user: uiUser };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to update profile.' };
    }
  },

  addAddress: async (addrData) => {
    try {
      await apiFetch('/api/v1/me/addresses', {
        method: 'POST',
        body: {
          label: addrData.label || 'Home',
          recipient_name: addrData.name || addrData.recipient_name || addrData.fullName,
          phone: addrData.phone || get().user?.rawPhone || '9876543210',
          line1: addrData.street || addrData.line1,
          line2: addrData.line2 || '',
          landmark: addrData.landmark || '',
          city: addrData.city || 'Panaji',
          state: addrData.state || 'Goa',
          pincode: addrData.pincode,
          is_default: addrData.isDefault ?? addrData.is_default,
        },
      });
      const refreshed = await get().refreshAddresses();
      return { ok: true, ...refreshed };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to save address.' };
    }
  },

  updateAddress: async (addressId, addrData) => {
    try {
      await apiFetch(`/api/v1/me/addresses/${addressId}`, {
        method: 'PATCH',
        body: {
          label: addrData.label,
          recipient_name: addrData.name ?? addrData.recipient_name,
          phone: addrData.phone,
          line1: addrData.street ?? addrData.line1,
          city: addrData.city,
          state: addrData.state,
          pincode: addrData.pincode,
          is_default: addrData.isDefault ?? addrData.is_default,
        },
      });
      const refreshed = await get().refreshAddresses();
      return { ok: true, ...refreshed };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to update address.' };
    }
  },

  setDefaultAddress: async (addressId) => {
    try {
      await apiFetch(`/api/v1/me/addresses/${addressId}/default`, {
        method: 'POST',
      });
      const refreshed = await get().refreshAddresses();
      return { ok: true, ...refreshed };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to set default address.' };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      await apiFetch(`/api/v1/me/addresses/${addressId}`, {
        method: 'DELETE',
      });
      const refreshed = await get().refreshAddresses();
      return { ok: true, ...refreshed };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to delete address.' };
    }
  },

  refreshAddresses: async () => {
    try {
      const res = await apiFetch('/api/v1/me/addresses');
      const currentUser = get().user;
      if (currentUser) {
        const mapped = mapServerUserToUiUser(currentUser, res.items || [], []);
        mapped.orders = currentUser.orders || [];
        set({ user: mapped });
      }
      return { ok: true, addresses: res.items || [] };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  fetchOrders: async () => {
    try {
      const res = await apiFetch('/api/v1/orders');
      const currentUser = get().user;
      const mappedOrders = (res.items || []).map(mapServerOrderToUiOrder);
      if (currentUser) {
        set({ user: { ...currentUser, orders: mappedOrders } });
      }
      return mappedOrders;
    } catch {
      return [];
    }
  },

  cancelOrder: async (orderNumber, reason) => {
    try {
      const order = await apiFetch(`/api/v1/orders/${encodeURIComponent(orderNumber)}/cancel`, {
        method: 'POST',
        body: { reason: reason || 'Cancelled by customer while pending payment' },
      });
      await get().fetchOrders();
      return { ok: true, order: mapServerOrderToUiOrder(order) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Please contact the store to cancel.' };
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setClientAuthTokens({ csrfToken: null, accessToken: null });
    set({ user: null, isHydrating: false, isInitialized: true });
    useCartStore.setState({ items: [], isLoggedIn: false });
  },

  isAuthenticated: () => Boolean(get().user),
}));
