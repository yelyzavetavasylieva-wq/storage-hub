import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { cn } from '@/lib/cn';
import Shell from './Shell.jsx';
import { useStorage } from './StorageContext.jsx';

// Section order — also the table-of-contents order (Figma 3946-92242).
const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'running', label: 'Running S3 drive' },
  { id: 'windows', label: 'Windows' },
  { id: 'linux', label: 'Linux' },
  { id: 'drive-management', label: 'Drive management' },
  { id: 'drive-configuration', label: 'Drive configuration' },
  { id: 'adding-a-drive', label: 'Adding a drive' },
  { id: 'aws-profiles', label: 'AWS profiles' },
  { id: 'provider-region', label: 'Provider and region management' },
  { id: 'provider-management', label: 'Provider management' },
  { id: 'managing-new-provider', label: 'Managing a new provider' },
  { id: 'adding-new-region', label: 'Adding a new region' },
  { id: 'advanced', label: 'Advanced' },
];

const PROVIDERS = [
  'Amazon S3', 'Backblaze B2', 'Cloudflare R2', 'DigitalOcean Spaces', 'IBM Cloud Object Storage',
  'IDrive e2', 'Linode', 'MinIO', 'Qort DSS', 'Oracle Cloud Storage', 'Scality', 'Seagate Lyve Cloud',
  'Wasabi', 'Any S3 Compatible Service (Custom Provider)',
];

// The sections below Windows aren't fleshed out in the Figma mock; kept as concise sample copy so the
// table of contents has real scroll targets (prototype — placeholder documentation text).
const EXTRA_SECTIONS = [
  { id: 'linux', title: 'Linux', text: 'On Linux, S3 Drive is controlled from the command line. Install the package for your distribution, then run the mount command with a configured profile to mount a drive.' },
  { id: 'drive-management', title: 'Drive management', text: 'Drives are listed on the Drives tab, where each can be started, stopped, edited, or removed. Use Add connection to create a new drive.' },
  { id: 'drive-configuration', title: 'Drive configuration', text: 'Every drive stores its provider, region, bucket, and credentials. Open a drive’s settings to change how it connects and which folders are exposed.' },
  { id: 'adding-a-drive', title: 'Adding a drive', text: 'Use the Add connection wizard to create a drive: name it and assign a drive letter, provide authentication, configure the storage settings, then review and confirm.' },
  { id: 'aws-profiles', title: 'AWS profiles', text: 'S3 Drive can read credentials from your AWS profile directory instead of storing keys directly. Enable “Use AWS profile” and point it at your profile location.' },
  { id: 'provider-region', title: 'Provider and region management', text: 'Providers and their available regions are managed together. Select a provider to see its regions, or add a custom provider for any S3-compatible service.' },
  { id: 'provider-management', title: 'Provider management', text: 'Add, edit, or remove storage providers. Built-in providers come preconfigured; custom providers let you specify your own endpoint URL and signature version.' },
  { id: 'managing-new-provider', title: 'Managing a new provider', text: 'To add a new provider, supply its endpoint URL, signature version, and default region. The provider then becomes available in the Add connection wizard.' },
  { id: 'adding-new-region', title: 'Adding a new region', text: 'Regions can be added to a provider by specifying the region code and endpoint. New regions become selectable when creating or editing a drive.' },
  { id: 'advanced', title: 'Advanced', text: 'Advanced settings cover signature versions, custom endpoints, connection timeouts, and command-line automation. Adjust these only if your provider requires it.' },
];

function Section({ id, title, children }) {
  // scroll-mt keeps a heading clear of the top edge when reached via a TOC anchor.
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-3">
      <h2 className="text-text-xl font-semibold text-primary">{title}</h2>
      <div className="flex flex-col gap-3 text-text-md text-primary">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  const { id } = useParams();
  const { getProvider } = useStorage();
  const provider = getProvider(id);
  const [active, setActive] = useState(SECTIONS[0].id);
  const contentRef = useRef(null);

  // Scroll-spy: the active TOC entry is the last section whose heading has passed the top of the
  // content scroll region. (A scroll listener is used rather than IntersectionObserver so the result
  // reflects every section's live position, not just the entries that happened to change.)
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;
    const onScroll = () => {
      // At the very bottom the last section can't reach the top, so activate it explicitly.
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
        setActive(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      const rootTop = root.getBoundingClientRect().top;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - rootTop <= 80) current = s.id;
      }
      setActive(current);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  if (!provider) return <Navigate to="/" replace />;
  const name = provider.name;

  return (
    <Shell fillViewport mainClassName="flex min-h-0 flex-col overflow-hidden p-4 sm:p-8">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-8">
        {/* Page header (Figma 3946-92247): breadcrumb, then 20px to the title, then 4px to the supporting text. */}
        <div className="flex shrink-0 flex-col gap-5">
          <Breadcrumbs items={[{ label: 'Storage hub', href: '/' }, { label: name, href: `/provider/${id}` }, { label: 'Help' }]} />
          <div className="flex flex-col gap-1">
            <h1 className="text-display-xs font-semibold text-primary">Help</h1>
            <p className="text-text-md text-tertiary">
              Find setup instructions, troubleshooting tips, and configuration guidance for this storage provider.
            </p>
          </div>
        </div>

        {/* Only the content column scrolls — the TopBar, header and table of contents stay put. */}
        <div className="flex min-h-0 flex-1 gap-8">
          {/* Table of contents — active entry gets a blue left border + blue label. */}
          <nav aria-label="On this page" className="scrollbar-thin hidden w-80 shrink-0 flex-col overflow-y-auto p-1 lg:flex">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'group flex h-11 items-center gap-3 rounded-sm text-text-sm font-semibold outline-none transition-colors focus-visible:ring-brand-focus',
                    isActive ? 'text-brand-primary' : 'text-primary hover:text-brand-primary',
                  )}
                >
                  {/* 2px state bar (Figma 3909-35042): gray by default, brand when hovered/selected. */}
                  <span
                    aria-hidden="true"
                    className={cn('h-11 w-0.5 shrink-0', isActive ? 'bg-brand-solid' : 'bg-quaternary group-hover:bg-brand-solid')}
                  />
                  <span className="truncate">{s.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Content (the scroll region) */}
          <div ref={contentRef} className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pr-2">
            <Section id="introduction" title="Introduction">
              <p>
                Welcome to {name} Drive, a powerful solution for accessing remote resources as if they were local
                drives, eliminating the need to download and upload files you need to work with. Easily manage remote
                files stored on any S3-compatible service from your favorite file management utility or the command
                line. Choose from the list of built-in providers or add your own provider to get started. Configure the
                access credentials and click the “Start” button to start browsing the file system.
              </p>
              <h3 className="text-text-md font-semibold text-primary">Features</h3>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>Work with a remote file system as if it were a local disk drive.</li>
                <li>Support for multiple drive configurations.</li>
                <li>Run as a Windows service or a desktop application.</li>
                <li>Upload and download files via your favorite file manager, such as Windows Explorer.</li>
                <li>Supports all common directory and file operations such as move, copy, and rename.</li>
                <li>
                  Support for all common providers including:
                  <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                    {PROVIDERS.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </li>
              </ul>
            </Section>

            <Section id="running" title="Running S3 drive">
              <p>
                S3 drive supports Windows, Linux and macOS. On Windows the application can be configured from the main
                window. On Linux and macOS the application can be controlled using the command line.
              </p>
            </Section>

            <Section id="windows" title="Windows">
              <p>
                The application can be started directly from the application’s main window, via command line, or
                configured to run as a Windows service. Please take a look at the Quick start guide for a step-by-step
                introduction. Drives may be managed from the Drives tab (see Drive management for more information).
              </p>
            </Section>

            {EXTRA_SECTIONS.map((s) => (
              <Section key={s.id} id={s.id} title={s.title}>
                <p>{s.text}</p>
              </Section>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
