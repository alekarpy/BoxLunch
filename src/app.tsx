import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';

import Layout from '@/pages/_layout';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/system/error-boundary';
import { AppLoadingWrapper } from '@/components/app-loading-wrapper';
import { AuthGuard } from '@/components/auth-guard';
import { DemoWidget } from '@/components/demo-widget';

import HomePage from '@/pages/index';
import NotFoundPage from '@/pages/not-found';
import UsuariosPage from '@/pages/usuarios';

function App() {
  // Normalize pathname to always include the /boxlunch basename
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/boxlunch')) {
    const targetPath = '/boxlunch' + (window.location.pathname === '/' ? '/' : window.location.pathname);
    window.history.replaceState(null, '', targetPath);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary resetQueryCache>
        <JotaiProvider>
          <Toaster richColors />
          <DemoWidget />
          <AuthGuard>
            <AppLoadingWrapper>
              <Router basename="/boxlunch">
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Router>
            </AppLoadingWrapper>
          </AuthGuard>
        </JotaiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
