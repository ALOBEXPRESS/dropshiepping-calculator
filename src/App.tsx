
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';
import { SettingsProvider } from './contexts/SettingsContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { queryClient } from './lib/react-query';
import { Toaster } from 'sonner';
import { LoadingState } from './components/ui/LoadingState';

// Lazy load components for code splitting
const DropshippingCalculator = lazy(() => import('./components/DropshippingCalculator'));
const LoginPremium = lazy(() => import('./components/LoginPremium'));
const Sales = lazy(() => import('./pages/Sales'));

const ProductsPage = () => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <DropshippingCalculator viewMode="products" />
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

const SalesPage = () => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Sales />
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SettingsProvider>
          <DateRangeProvider>
            <BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
              },
              className: 'sonner-toast',
              duration: 3000,
            }}
          />
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/login" element={<LoginPremium />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DropshippingCalculator />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/vendas" element={<SalesPage />} />
            </Routes>
          </Suspense>
            </BrowserRouter>
          </DateRangeProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
