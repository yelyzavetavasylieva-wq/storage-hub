import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Storage hub — a standalone dev server migrated onto the real myWorkDrive-React
// stack: Tailwind v4 + React Aria Components. The design system (globals.css
// tokens + the `components/ui` library + `lib/cn`) plus the icons/logos/flags are
// vendored under `./vendor` verbatim from the React app; `@` resolves there so the
// components' own `@/...` imports work unchanged. `svgr` handles their `*.svg?react`
// icon imports. Fully self-contained.
// Runs on port 5200.
export default defineConfig({
  root: dirname,
  // React Compiler enabled (per the myWorkDrive-React stack) — auto-memoizes, so screens carry no
  // manual useMemo/useCallback/memo.
  plugins: [svgr(), react({ babel: { presets: [reactCompilerPreset({ target: '19' })] } }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'vendor'),
    },
    // Dedupe so the vendored components and the app always share one React instance.
    dedupe: ['react', 'react-dom', 'react-aria-components', 'react-aria'],
  },
  server: {
    port: 5200,
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app', '.ngrok.io'],
  },
});
