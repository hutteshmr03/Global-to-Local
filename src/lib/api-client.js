/**
 * Global to Local — Unified API Client (/api/v1)
 * Uses httpOnly SameSite=Lax cookies + double-submit X-CSRF-Token header.
 */

import { handleMockBackend } from './mock-backend';

const RENDER_BACKEND_URL = 'https://global-to-local.onrender.com';

let inMemoryCsrfToken = typeof localStorage !== 'undefined' ? localStorage.getItem('gtl_csrf_token') : null;
let inMemoryAccessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('gtl_access_token') : null;
let inMemoryRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('gtl_refresh_token') : null;

export function setClientAuthTokens({ csrfToken, accessToken, refreshToken } = {}) {
  if (csrfToken !== undefined) {
    inMemoryCsrfToken = csrfToken;
    try {
      if (csrfToken) localStorage.setItem('gtl_csrf_token', csrfToken);
      else localStorage.removeItem('gtl_csrf_token');
    } catch {}
  }
  if (accessToken !== undefined) {
    inMemoryAccessToken = accessToken;
    try {
      if (accessToken) localStorage.setItem('gtl_access_token', accessToken);
      else localStorage.removeItem('gtl_access_token');
    } catch {}
  }
  if (refreshToken !== undefined) {
    inMemoryRefreshToken = refreshToken;
    try {
      if (refreshToken) localStorage.setItem('gtl_refresh_token', refreshToken);
      else localStorage.removeItem('gtl_refresh_token');
    } catch {}
  }
}

export function clearClientAuthTokens() {
  inMemoryCsrfToken = null;
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  try {
    localStorage.removeItem('gtl_csrf_token');
    localStorage.removeItem('gtl_access_token');
    localStorage.removeItem('gtl_refresh_token');
    localStorage.removeItem('gtl_user_session');
    localStorage.removeItem('gtl_mock_auth_user_v1');
  } catch {}
}

export function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getCsrfToken() {
  return getCookieValue('gtl_csrf_token') || inMemoryCsrfToken || '';
}

export function getCartSessionToken() {
  if (typeof localStorage === 'undefined') return '';
  let token = localStorage.getItem('gtl_cart_session_token');
  if (!token) {
    token = 'cs_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    try {
      localStorage.setItem('gtl_cart_session_token', token);
    } catch {}
  }
  return token;
}

export class ApiProblemError extends Error {
  constructor(status, problem) {
    const rawMsg = problem?.detail || problem?.title || `Request failed (${status})`;
    const isServerError = status >= 500 || String(rawMsg).includes('500') || String(rawMsg).includes('ECONNREFUSED');
    const friendlyMsg = isServerError ? 'Something went wrong. Please try again.' : rawMsg;
    super(friendlyMsg);
    this.name = 'ApiProblemError';
    this.status = status;
    this.title = problem?.title || (isServerError ? 'Something went wrong' : 'Error');
    this.detail = friendlyMsg;
    this.type = problem?.type || '';
    this.errors = problem?.errors || [];
    this.traceId = problem?.trace_id || '';
  }
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (
    (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) ||
    (typeof options.body === 'string' && (options.body.startsWith('{') || options.body.startsWith('[')))
  ) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  const cartSession = getCartSessionToken();
  if (cartSession && !headers['X-Cart-Session']) {
    headers['X-Cart-Session'] = cartSession;
  }

  if (inMemoryAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const fetchOptions = {
    ...options,
    method,
    headers,
    credentials: 'include',
    body:
      options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  };

  const isHostedDomain =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // In production (globaltolocal.in), call Render directly so LiteSpeed proxy never hangs for 15+ seconds
  const primaryUrl = isHostedDomain && path.startsWith('/api')
    ? `${RENDER_BACKEND_URL}${path}`
    : path;

  let res = null;
  let networkFailed = false;

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4500) : null;
    try {
      res = await fetch(primaryUrl, {
        ...fetchOptions,
        signal: controller ? controller.signal : undefined,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch (err) {
    networkFailed = true;
  }

  // Dual-tier failover: If direct Render call failed, try local endpoint
  if ((networkFailed || !res || !res.ok) && isHostedDomain && primaryUrl !== path) {
    try {
      const fallbackRes = await fetch(path, fetchOptions);
      if (fallbackRes && fallbackRes.ok) {
        res = fallbackRes;
        networkFailed = false;
      }
    } catch {}
  }

  // Standalone fallback: Only when backend server is completely unreachable (networkFailed)
  // or proxy gateway failed (444, 502, 503, 504 on hosted preview environments).
  const isGatewayUnreachable = res && [444, 502, 503, 504].includes(res.status);
  const isRouteNotFound = res && res.status === 404;
  if (networkFailed || isGatewayUnreachable || isRouteNotFound) {
    try {
      const mockResult = await handleMockBackend(path, options, method);
      if (mockResult !== undefined) {
        return mockResult;
      }
    } catch (mockErr) {
      if (mockErr instanceof ApiProblemError || mockErr.name === 'ApiProblemError') {
        throw mockErr;
      }
      throw new ApiProblemError(mockErr.status || 400, { detail: mockErr.detail || mockErr.message || 'Request failed' });
    }
  }

  if (networkFailed || !res) {
    throw new ApiProblemError(503, { detail: 'Backend server is unreachable.' });
  }

  // Automatic token refresh on 401 (except for auth endpoints themselves)
  if (
    res.status === 401 &&
    !options._retried &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/register') &&
    !path.includes('/auth/otp') &&
    !path.includes('/auth/refresh') &&
    !path.includes('/auth/logout')
  ) {
    try {
      const refreshPayload = inMemoryRefreshToken ? { refresh_token: inMemoryRefreshToken } : {};
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(inMemoryRefreshToken ? { 'X-Refresh-Token': inMemoryRefreshToken } : {}),
        },
        body: JSON.stringify(refreshPayload),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setClientAuthTokens({
          csrfToken: refreshData.csrf_token,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || inMemoryRefreshToken,
        });
        return apiFetch(path, { ...options, _retried: true });
      }
    } catch {
      // Refresh failed, proceed with original 401
    }
  }

  if (res.status === 204) {
    return null;
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    throw new ApiProblemError(res.status, data);
  }

  return data;
}

/**
 * Fetch all 230 products across paginated /api/v1/products (max 60 per page)
 */
export async function fetchAllCatalogueProducts() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Catalogue fetch timeout')), 4500)
    );

    const fetchPromise = (async () => {
      const firstPage = await apiFetch('/api/v1/products?page=1&page_size=60');
      const items = [...(firstPage.items || [])];
      const totalPages = firstPage.meta?.total_pages || 1;
      if (totalPages > 1) {
        const remainingPromises = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPromises.push(apiFetch(`/api/v1/products?page=${p}&page_size=60`));
        }
        const pages = await Promise.all(remainingPromises);
        for (const pg of pages) {
          if (pg?.items) {
            items.push(...pg.items);
          }
        }
      }
      return items;
    })();

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result || [];
  } catch {
    return [];
  }
}