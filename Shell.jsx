import React, { useRef, useEffect } from 'react';
import TopBar from './TopBar.jsx';

// Once true, every subsequent screen mount is a route change, so focus moves to <main> (WCAG 2.4.3
// focus order after navigation). The very first landing is skipped so we don't yank focus off the
// page the user just opened.
let hasNavigated = false;

// App shell shared by every routed screen: a skip link (WCAG 2.4.1 Bypass Blocks), the TopBar, and
// the <main id="main-content" tabIndex={-1}> that both the skip link and route-change focus target.
// `fillViewport` locks the shell to the viewport height (fixed TopBar) so a page can own an internal
// scroll region instead of scrolling the whole document — used by the Help page's content column.
export default function Shell({ mainClassName = '', fillViewport = false, children }) {
  const mainRef = useRef(null);
  useEffect(() => {
    if (hasNavigated) mainRef.current?.focus({ preventScroll: true });
    hasNavigated = true;
  }, []);

  return (
    <div className={`bg-primary ${fillViewport ? 'flex h-screen flex-col overflow-hidden' : 'min-h-screen'}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-text-sm focus:font-semibold focus:text-brand-links focus:shadow-sm focus:outline-none focus:ring-brand"
      >
        Skip to main content
      </a>
      <TopBar />
      <main id="main-content" tabIndex={-1} ref={mainRef} className={`outline-none ${fillViewport ? 'min-h-0 flex-1' : ''} ${mainClassName}`}>
        {children}
      </main>
    </div>
  );
}
