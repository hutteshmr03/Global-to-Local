import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'gtl.customer.auth.v1';
const USERS_STORAGE_KEY = 'gtl.customer.registry.v1';

function cleanPhone(p) {
  return (p || '').replace(/\D/g, '').slice(-10);
}

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const users = raw ? JSON.parse(raw) : [];

    // If an active user exists from before, ensure they are also recorded in registry
    const active = localStorage.getItem(AUTH_STORAGE_KEY);
    if (active) {
      const activeUser = JSON.parse(active);
      if (activeUser?.phone && !users.some(u => cleanPhone(u.phone) === cleanPhone(activeUser.phone))) {
        users.push(activeUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    }
    return users;
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }
}

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

  // Check if a customer exists by 10-digit mobile number
  findUserByPhone: (phone) => {
    const digits = cleanPhone(phone);
    if (!digits || digits.length < 10) return null;
    const users = getRegisteredUsers();
    return users.find(u => cleanPhone(u.phone) === digits) || null;
  },

  // Check if a customer exists by email
  findUserByEmail: (email) => {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return null;
    const users = getRegisteredUsers();
    return users.find(u => (u.email || '').trim().toLowerCase() === normalized) || null;
  },

  // Register a new customer
  registerUser: (userData) => {
    const phoneDigits = cleanPhone(userData.phone);
    const users = getRegisteredUsers();

    if (phoneDigits && users.some(u => cleanPhone(u.phone) === phoneDigits)) {
      return { error: 'An account already exists with this mobile number. Please sign in instead.' };
    }

    if (userData.email && users.some(u => (u.email || '').trim().toLowerCase() === userData.email.trim().toLowerCase())) {
      return { error: 'An account already exists with this email address. Please sign in instead.' };
    }

    const newUser = {
      id: 'cust_' + Date.now().toString(36),
      name: userData.name?.trim() || 'Goan Foodie',
      email: userData.email?.trim() || '',
      phone: phoneDigits ? '+91 ' + phoneDigits : '',
      avatar: userData.avatar || '',
      addresses: userData.addresses || [],
      orders: userData.orders || [],
      joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }

    set({ user: newUser });
    return { user: newUser };
  },

  // Sign in an existing customer with mobile number
  loginWithPhone: (phone) => {
    const digits = cleanPhone(phone);
    const user = get().findUserByPhone(digits);
    if (!user) {
      return { error: 'No account found with this mobile number. Please create an account first.' };
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    set({ user });
    return { user };
  },

  // Sign in with email
  loginWithEmail: (email, password) => {
    const user = get().findUserByEmail(email);
    if (!user) {
      return { error: 'No account found with this email. Please create an account first.' };
    }

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    set({ user });
    return { user };
  },

  // Fallback login
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

    const users = getRegisteredUsers();
    const phoneDigits = cleanPhone(user.phone);
    const existingIdx = users.findIndex(u => phoneDigits && cleanPhone(u.phone) === phoneDigits);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...user };
    } else {
      users.push(user);
    }
    saveRegisteredUsers(users);

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

    // Also update in registered registry
    const users = getRegisteredUsers();
    const phoneDigits = cleanPhone(currentUser.phone);
    const idx = users.findIndex(u => (phoneDigits && cleanPhone(u.phone) === phoneDigits) || u.id === currentUser.id);
    if (idx >= 0) {
      users[idx] = updated;
      saveRegisteredUsers(users);
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

    // Also update in registered registry
    const users = getRegisteredUsers();
    const phoneDigits = cleanPhone(currentUser.phone);
    const idx = users.findIndex(u => (phoneDigits && cleanPhone(u.phone) === phoneDigits) || u.id === currentUser.id);
    if (idx >= 0) {
      users[idx] = updated;
      saveRegisteredUsers(users);
    }

    set({ user: updated });
  },

  isAuthenticated: () => {
    return Boolean(get().user);
  },
}));
