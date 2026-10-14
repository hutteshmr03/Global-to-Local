/**
 * Global to Local — Unified API Client (/api/v1)
 * Uses httpOnly SameSite=Lax cookies + double-submit X-CSRF-Token header.
 */

import { handleMockBackend } from './mock-backend';

let inMemoryCsrfToken = null;
let inMemoryAccessToken = null;

export function setClientAuthTokens({ csrfToken, accessToken } = {}) {
  if (csrfToken !== undefined) inMemoryCsrfToken = csrfToken;
  if (accessToken !== undefined) inMemoryAccessToken = accessToken;
}

export function getCookieValue(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getCsrfToken() {
  return getCookieValue('gtl_csrf_token') || inMemoryCsrfToken || '';
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

  let res = null;
  let networkFailed = false;

  try {
    res = await fetch(path, fetchOptions);
  } catch (err) {
    networkFailed = true;
  }

  // Standalone fallback: Only when backend server is completely unreachable (networkFailed)
  // Ensures catalogue fallback never overrides live API data.
  if (networkFailed) {
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
    !path.includes('/auth/refresh')
  ) {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setClientAuthTokens({
          csrfToken: refreshData.csrf_token,
          accessToken: refreshData.access_token,
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
}
