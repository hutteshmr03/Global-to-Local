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


function loadSavedUserSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gtl_user_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUserSession(uiUser) {
  if (typeof window === 'undefined') return;
  try {
    if (uiUser) {
      localStorage.setItem('gtl_user_session', JSON.stringify(uiUser));
    } else {
      localStorage.removeItem('gtl_user_session');
    }
  } catch {}
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

export const useAuthStore = create((set, get) => {
  const cachedUser = loadSavedUserSession();
  return {
  user: cachedUser,
  isHydrating: !cachedUser,
  isInitialized: true,

  fetchMe: async () => {
    return await get().hydrateSession();
  },

  hydrateSession: async () => {
    const existing = get().user || loadSavedUserSession();
    if (existing && !get().user) {
      set({ user: existing });
    }
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
      persistUserSession(uiUser);
      set({ user: uiUser, isHydrating: false, isInitialized: true });
      await useCartStore.getState().hydrateCart(true);
      return uiUser;
    } catch (err) {
      // If server unreachable or error, DO NOT log off unless explicit 401 without refresh capability
      const hasRefreshToken = typeof localStorage !== 'undefined' && localStorage.getItem('gtl_refresh_token');
      if (err?.status === 401 && !hasRefreshToken) {
        // Intentionally invalid / revoked
        persistUserSession(null);
        set({ user: null, isHydrating: false, isInitialized: true });
        await useCartStore.getState().hydrateCart(false);
        return null;
      }
      // Never log off customer on refresh, background calls, or temporary failures
      if (existing) {
        set({ user: existing, isHydrating: false, isInitialized: true });
        await useCartStore.getState().hydrateCart(true);
        return existing;
      }
      set({ user: null, isHydrating: false, isInitialized: true });
      await useCartStore.getState().hydrateCart(false);
      return null;
    }
  },

  loginWithPhone: async ({ phone, mode = 'login', name, email }) => {
    try {
      const guestItems = useCartStore.getState().getGuestItemsPayload();
      const res = await apiFetch('/api/v1/auth/phone/direct', {
        method: 'POST',
        body: {
          phone,
          mode: mode === 'signup' ? 'register' : 'login',
          name: name || undefined,
          email: email || undefined,
          guest_items: guestItems,
        },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const uiUser = mapServerUserToUiUser(res.user);
      set({ user: uiUser, isInitialized: true, isHydrating: false });
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || uiUser };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Unable to sign in. Please try again.' };
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
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const uiUser = mapServerUserToUiUser(res.user);
      set({ user: uiUser, isInitialized: true, isHydrating: false });
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || uiUser };
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
          password: userData.password,
          phone: userData.phone || undefined,
          guest_items: guestItems,
        },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const uiUser = mapServerUserToUiUser(res.user);
      set({ user: uiUser, isInitialized: true, isHydrating: false });
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || uiUser };
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
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const uiUser = mapServerUserToUiUser(res.user);
      set({ user: uiUser, isInitialized: true, isHydrating: false });
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || uiUser };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid email address or password.' };
    }
  },

  setupMfa: async (tempToken) => {
    try {
      const res = await apiFetch('/api/v1/auth/mfa/setup', {
        method: 'POST',
        body: { temp_token: tempToken },
      });
      return { ok: true, secret: res.secret, qr_uri: res.qr_uri, recovery_codes: res.recovery_codes, current_totp: res.current_totp };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Failed to initiate 2FA setup.' };
    }
  },

  confirmMfa: async (tempToken, code) => {
    try {
      const res = await apiFetch('/api/v1/auth/mfa/confirm', {
        method: 'POST',
        body: { temp_token: tempToken, code },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || mapServerUserToUiUser(res.user) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid 6-digit code. Please try again.' };
    }
  },

  verifyMfa: async (tempToken, code) => {
    try {
      const guestItems = useCartStore.getState().getGuestItemsPayload();
      const res = await apiFetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        body: { temp_token: tempToken, code, guest_items: guestItems },
      });
      setClientAuthTokens({
        csrfToken: res.csrf_token,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      if (res.cart) {
        useCartStore.getState().setFromServerCart(res.cart, true);
      }
      const hydrated = await get().hydrateSession();
      return { ok: true, user: hydrated || mapServerUserToUiUser(res.user) };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Invalid 2FA code or recovery code.' };
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

  updatePassword: async ({ currentPassword, newPassword }) => {
    try {
      const res = await apiFetch('/api/v1/me/password', {
        method: 'POST',
        body: {
          current_password: currentPassword || undefined,
          new_password: newPassword,
        },
      });
      return { ok: true, message: res.message || 'Password updated successfully.' };
    } catch (err) {
      return { ok: false, error: err.detail || err.message || 'Failed to update password.' };
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
    // 1. Immediately wipe client tokens and session synchronously so UI reacts instantly
    persistUserSession(null);
    clearClientAuthTokens();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('gtl_mock_auth_user_v1');
        localStorage.removeItem('gtl_user_session');
        localStorage.removeItem('gtl_access_token');
        localStorage.removeItem('gtl_refresh_token');
        localStorage.removeItem('gtl_csrf_token');
      } catch {}
    }
    set({ user: null, isHydrating: false, isInitialized: true });
    useCartStore.setState({ items: [], isLoggedIn: false });

    // 2. Best-effort server notification with a fast timeout (2.5s) so it never blocks or hangs
    try {
      const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('gtl_refresh_token') : null;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
        signal: controller ? controller.signal : undefined,
      }).catch(() => {});
      if (timeoutId) clearTimeout(timeoutId);
    } catch {
      // ignore
    }
  },

  isAuthenticated: () => Boolean(get().user),
};
});
