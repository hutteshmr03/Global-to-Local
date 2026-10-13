import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/catalogue-hooks';
import { useAuthStore } from './lib/auth-store';
import './styles/globals.css';

// Hydrate server session & cart on application startup
useAuthStore.getState().hydrateSession();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
