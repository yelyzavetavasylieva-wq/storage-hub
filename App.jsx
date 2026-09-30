import React from 'react';
import { Routes, Route, Navigate, useNavigate, useHref } from 'react-router-dom';
import { RouterProvider } from 'react-aria-components';
import { Toaster } from 'sonner';
import { StorageProvider } from './StorageContext.jsx';
import StorageHubPage from './StorageHubPage.jsx';
import ProviderPage from './ProviderPage.jsx';
import HelpPage from './HelpPage.jsx';
import AddConnectionWizard from './AddConnectionWizard.jsx';
import EditConnectionPage from './EditConnectionPage.jsx';
import OAuthCallbackPage from './OAuthCallbackPage.jsx';

// Storage hub — a standalone surface (no admin sidebar). Two screens today:
// the hub (provider catalog) and a per-provider connections page. `Toaster` hosts
// the sonner-backed toasts that ui/toast.tsx's `notify` renders into.
export default function App() {
  // Lets React Aria links (e.g. Breadcrumbs) navigate through React Router instead of reloading the
  // page — a reload would wipe the in-memory StorageContext.
  const navigate = useNavigate();
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
    <StorageProvider>
      <Routes>
        <Route path="/" element={<StorageHubPage />} />
        <Route path="/provider/:id" element={<ProviderPage />} />
        <Route path="/provider/:id/help" element={<HelpPage />} />
        <Route path="/provider/:id/new-connection" element={<AddConnectionWizard />} />
        <Route path="/provider/:id/edit/:connId" element={<EditConnectionPage />} />
        {/* OAuth redirect target — opened in the browser window during interactive sign-in. */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" offset={24} gap={8} toastOptions={{ unstyled: true, className: 'w-96 max-w-[calc(100vw-2rem)]' }} />
    </StorageProvider>
    </RouterProvider>
  );
}
