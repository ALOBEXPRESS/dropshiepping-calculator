
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserProvider } from './contexts/UserContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import { queryClient } from './lib/react-query';
import { Toaster } from 'sonner';
import { LoadingState } from './components/ui/LoadingState';

const ThemedToaster = () => {
  const { theme } = useTheme();
  return (
    <Toaster 
      position="top-right"
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
        className: 'sonner-toast',
        duration: 3000,
      }}
    />
  );
};

// Lazy load components for code splitting
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RepasePage = lazy(() => import('./pages/RepasePage'));
const DropshippingCalculator = lazy(() => import('./components/DropshippingCalculator'));
const LoginPremium = lazy(() => import('./components/LoginPremium'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sales = lazy(() => import('./pages/Sales'));
const Leads = lazy(() => import('./pages/Leads'));
const Campaigns = lazy(() => import('./pages/CampaignsPage'));
const PlatformAccounts = lazy(() => import('./pages/PlatformAccountsPage'));
const AdAccounts = lazy(() => import('./pages/AdAccountsPage'));
const AdAccountDetail = lazy(() => import('./pages/AdAccountDetailPage'));
const Proxies = lazy(() => import('./pages/ProxiesPage'));
const ProxyProviders = lazy(() => import('./pages/ProxyProvidersPage'));
const Devices = lazy(() => import('./pages/DevicesPage'));
const BrowserProfiles = lazy(() => import('./pages/BrowserProfilesPage'));
const BusinessCenters = lazy(() => import('./pages/BusinessCentersPage'));
const InfraMap = lazy(() => import('./pages/InfraMapPage').then(m => ({ default: m.InfraMapPage })));
const ResponsaveisPg = lazy(() => import('./pages/ResponsaveisPage'));
const NegocioPage = lazy(() => import('./pages/NegocioPage'));
const BMCCanvasPage = lazy(() => import('./pages/BMCCanvasPage'));

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
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Sales />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const DashboardPage = () => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Dashboard />
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

const LeadsPage = () => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Leads />
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

const CampaignsPage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Campaigns />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const PlatformAccountsRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <PlatformAccounts />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const AdAccountsRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <AdAccounts />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const AdAccountDetailRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <AdAccountDetail />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const ProxiesRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Proxies />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const ProxyProvidersRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <ProxyProviders />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const DevicesRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Devices />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const BrowserProfilesRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <BrowserProfiles />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const BusinessCentersRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <BusinessCenters />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const ResponsaveisRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <ResponsaveisPg />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const InfraMapRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <InfraMap />
      </Suspense>
    </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const NegocioRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
      <Layout>
        <Suspense fallback={<LoadingState />}>
          <NegocioPage />
        </Suspense>
      </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

const BMCSectionRedirect = () => {
  const { bcId, section } = useParams();
  return <Navigate to={`/negocio/${bcId}/canvas${section ? `?section=${section}` : ''}`} replace />;
};

const BMCCanvasRoutePage = () => (
  <ProtectedRoute>
    <AdminRoute>
      <Layout>
        <Suspense fallback={<LoadingState />}>
          <BMCCanvasPage />
        </Suspense>
      </Layout>
    </AdminRoute>
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SettingsProvider>
          <UserProvider>
          <DateRangeProvider>
            <BrowserRouter>
          <ThemedToaster />
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/vendas" element={<SalesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/campanhas" element={<CampaignsPage />} />
              <Route path="/contas" element={<PlatformAccountsRoutePage />} />
              <Route path="/contas/conta" element={<PlatformAccountsRoutePage />} />
              <Route path="/contas-anuncios" element={<AdAccountsRoutePage />} />
              <Route path="/contas/contas-anuncios" element={<AdAccountsRoutePage />} />
              <Route path="/contas-anuncios/:id" element={<AdAccountDetailRoutePage />} />
              <Route path="/proxies" element={<ProxiesRoutePage />} />
              <Route path="/contas/proxies" element={<ProxiesRoutePage />} />
              <Route path="/provedores" element={<ProxyProvidersRoutePage />} />
              <Route path="/contas/provedores" element={<ProxyProvidersRoutePage />} />
              <Route path="/dispositivos" element={<DevicesRoutePage />} />
              <Route path="/contas/dispositivos" element={<DevicesRoutePage />} />
              <Route path="/perfis-navegador" element={<BrowserProfilesRoutePage />} />
              <Route path="/contas/perfis-navegador" element={<BrowserProfilesRoutePage />} />
              <Route path="/contas/perfis-de-navegador" element={<BrowserProfilesRoutePage />} />
              <Route path="/business-centers" element={<BusinessCentersRoutePage />} />
              <Route path="/contas/business-centers" element={<BusinessCentersRoutePage />} />
              <Route path="/responsaveis" element={<ResponsaveisRoutePage />} />
              <Route path="/contas/responsaveis" element={<ResponsaveisRoutePage />} />
              <Route path="/mapa" element={<InfraMapRoutePage />} />
              <Route path="/contas/mapa" element={<InfraMapRoutePage />} />
              <Route path="/negocio" element={<NegocioRoutePage />} />
              <Route path="/negocio/:bcId/canvas" element={<BMCCanvasRoutePage />} />
              <Route path="/negocio/:bcId/:section" element={<BMCSectionRedirect />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<LoadingState />}>
                      <ProfilePage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/repasse" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Layout>
                      <Suspense fallback={<LoadingState />}>
                        <RepasePage />
                      </Suspense>
                    </Layout>
                  </AdminRoute>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
            </BrowserRouter>
          </DateRangeProvider>
          </UserProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
