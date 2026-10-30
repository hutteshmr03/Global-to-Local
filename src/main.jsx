import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/catalogue-hooks';
import { useAuthStore } from './lib/auth-store';
import './styles/globals.css';

// One-time purge of legacy mock data from client localStorage
try {
  const PURGE_FLAG = 'gtl_mock_purge_v1';
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(PURGE_FLAG)) {
    const mockKeys = [
      'gtl_mock_auth_user_v1',
      'gtl_mock_customers_v5',
      'gtl_mock_orders_v5',
      'gtl_mock_addresses_v1',
      'gtl_mock_enquiries_v5',
      'gtl_mock_products_v3',
      'gtl_mock_news_v1',
      'gtl_mock_price_history_v1',
      'gtl_mock_reviews_v1',
    ];
    mockKeys.forEach((key) => localStorage.removeItem(key));

    const token = localStorage.getItem('gtl_access_token');
    if (token && token.startsWith('mock-jwt-token')) {
      localStorage.removeItem('gtl_access_token');
      localStorage.removeItem('gtl_user_session');
    }
    localStorage.setItem(PURGE_FLAG, 'true');
  }
} catch {
  // Ignore localStorage access errors
}

// Hydrate server session & cart on application startup
useAuthStore.getState().hydrateSession();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
