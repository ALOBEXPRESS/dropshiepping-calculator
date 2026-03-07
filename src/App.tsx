
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeProvider';
import { SettingsProvider } from './contexts/SettingsContext';
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SettingsProvider>
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
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default App
