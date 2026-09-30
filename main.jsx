import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// Migrated onto the real myWorkDrive-React stack: the design system (Tailwind v4 `@theme`
// tokens + the `components/ui` library) is vendored under ./vendor. globals.css is the single
// stylesheet — it `@import`s Tailwind and defines every token/utility the components use.
import './vendor/styles/globals.css';

// Dev-only visual feedback toolbar (excluded from production builds).
const Agentation = import.meta.env.DEV
  ? React.lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
  : null;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {Agentation && (
        <React.Suspense fallback={null}>
          <Agentation />
        </React.Suspense>
      )}
    </BrowserRouter>
  </React.StrictMode>
);
