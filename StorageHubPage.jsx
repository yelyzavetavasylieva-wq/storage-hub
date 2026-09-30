import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { Badge } from '@/components/ui/badge';
import { SegmentedTabs } from '@/components/ui/tabs';
import { MenuTrigger, Menu, MenuItem, MenuSeparator, Popover } from '@/components/ui/menu';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { IconEdit, IconDismiss } from '@/icons.jsx';
import { ArrowImportIcon } from '@/fluent/ArrowImportIcon.jsx';
import { ArrowDownloadIcon } from '@/fluent/ArrowDownloadIcon.jsx';
import { AddIcon } from '@/fluent/AddIcon.jsx';
import { BranchForkIcon } from '@/fluent/BranchForkIcon.jsx';
import { MoreHorizontalIcon } from '@/fluent/MoreHorizontalIcon.jsx';
import { InfoIcon } from '@/fluent/InfoIcon.jsx';
import { ArrowClockwiseIcon } from '@/fluent/ArrowClockwiseIcon.jsx';
import { StopIcon } from '@/fluent/StopIcon.jsx';
import Shell from './Shell.jsx';
import ExportConfigModal from './ExportConfigModal.jsx';
import { STATUS_LABELS } from './data.js';
import { useStorage } from './StorageContext.jsx';

// Map the sample-data status tone to a Badge color variant.
const BADGE_COLOR = { green: 'success', gray: 'neutral', red: 'error', orange: 'warning' };

// A single "frequently used connection" card in the top scroller.
function ConnectionCard({ conn, onRemove }) {
  const status = STATUS_LABELS[conn.status];
  const { Logo } = conn;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
      <div className="flex items-center gap-2">
        {/* Logo + name + status stay grouped at the left (name truncates when tight); the overflow
            menu is pushed to the far right — matching Figma 3917:94216, not spread by the name. */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center [&>svg]:max-h-6 [&>svg]:max-w-6"><Logo /></span>
          <span className="min-w-0 truncate text-text-md font-semibold text-primary" title={conn.name}>{conn.name}</span>
          <Badge color={BADGE_COLOR[status.tone]} className="shrink-0">{status.text}</Badge>
        </div>
        <MenuTrigger>
          {/* Bare 20px overflow icon — no button container/hover fill (Figma 4213-140407). */}
          <Button variant="tertiary" size="sm" iconOnly className="size-5 shrink-0 p-0 fg-quaternary! data-hovered:bg-transparent!" aria-label={`Actions for ${conn.name}`}>
            <MoreHorizontalIcon size={20} />
          </Button>
          <Popover placement="bottom end" className="w-60">
            {/* Same actions as the provider connections table (Figma 4237-18824). */}
            <Menu onAction={(key) => { if (key === 'remove') onRemove(conn.id); }}>
              <MenuItem id="details" icon={<InfoIcon size={16} />}>Details</MenuItem>
              <MenuItem id="restart" icon={<ArrowClockwiseIcon size={16} />}>Restart</MenuItem>
              <MenuItem id="stop" icon={<StopIcon size={16} />}>Stop</MenuItem>
              <MenuSeparator />
              <MenuItem id="edit" icon={<IconEdit />}>Edit</MenuItem>
              <MenuItem id="remove" icon={<IconDismiss />} className="text-error-primary">Remove from list</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
      <p className="text-text-sm text-tertiary">{conn.modified}</p>
    </div>
  );
}

// A provider card in the "All providers" grid. The whole card opens the
// provider page; the trailing "+" adds a connection without navigating.
function ProviderCard({ provider, onOpen, onAdd }) {
  const { Logo } = provider;
  const count = provider.connections.length;
  const configured = count > 0;
  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-secondary bg-primary p-6 shadow-xs transition hover:border-brand hover:shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-brand"
      role="button"
      tabIndex={0}
      aria-label={`Open ${provider.name}`}
      // A click that originated on the trailing Add button opens nothing — the button owns it.
      onClick={(e) => { if (e.target.closest('button')) return; onOpen(provider.id); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(provider.id); } }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center [&>svg]:max-h-6 [&>svg]:max-w-6"><Logo /></span>
        <span className="whitespace-nowrap text-text-md font-semibold text-primary">{provider.name}</span>
        <Badge color={configured ? 'success' : 'neutral'}>{configured ? 'Configured' : 'Not configured'}</Badge>
        <span className="inline-flex items-center gap-1 text-text-sm text-quaternary">
          <BranchForkIcon size={16} />
          {count}
        </span>
      </div>
      <TooltipTrigger>
        {/* 32px icon-only button (Figma 5417-62269) — the occasional xs size. */}
        <Button variant="secondary" size="xs" iconOnly aria-label={`Add ${provider.name} connection`} onPress={() => onAdd(provider.id)}>
          <AddIcon size={20} />
        </Button>
        <Tooltip placement="top">Add connection</Tooltip>
      </TooltipTrigger>
    </div>
  );
}

export default function StorageHubPage() {
  const navigate = useNavigate();
  const { providers, frequent, removeFrequent } = useStorage();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [exportOpen, setExportOpen] = useState(false);

  const configuredCount = providers.filter((p) => p.connections.length > 0).length;

  const q = query.trim().toLowerCase();
  const visibleProviders = providers.filter((p) => {
    if (tab === 'configured' && p.connections.length === 0) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Shell mainClassName="flex flex-col gap-8 p-4 sm:p-8">
        {/* Page header + frequently used connections */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-display-xs font-semibold text-primary">Storage hub</h1>
              <p className="text-text-md text-tertiary">View and manage your storage providers and connections.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary"><ArrowImportIcon size={20} />Import configuration</Button>
              <Button variant="secondary" onPress={() => setExportOpen(true)}><ArrowDownloadIcon size={20} />Export configuration</Button>
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-md border border-secondary bg-primary p-5 shadow-xs">
            <div className="flex flex-col gap-1">
              <h2 className="text-text-xl font-semibold text-primary">Frequently used connections</h2>
              <p className="text-text-sm text-tertiary">Storage connections you access most often.</p>
            </div>
            <ul className="flex gap-6 overflow-x-auto scrollbar-thin pb-5">
              {frequent.map((conn) => (
                <li key={conn.id} className="w-80 shrink-0">
                  <ConnectionCard conn={conn} onRemove={removeFrequent} />
                </li>
              ))}
              {frequent.length === 0 && <p className="py-2 text-text-sm text-tertiary">No frequently used connections.</p>}
            </ul>
          </div>

          <SegmentedTabs
            aria-label="Provider filter"
            value={tab}
            onChange={setTab}
            fullWidth
            tabs={[
              { id: 'all', label: `All providers (${providers.length})` },
              { id: 'configured', label: `Configured (${configuredCount})` },
            ]}
          />
        </section>

        {/* All providers */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-text-xl font-semibold text-primary">All providers</h2>
            <p className="text-text-sm text-tertiary">All your available providers in one place.</p>
          </div>

          <SearchField className="w-80 max-w-full" aria-label="Search providers" value={query} onChange={setQuery} />

          {visibleProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onOpen={(id) => navigate(`/provider/${id}`)}
                  onAdd={(pid) => navigate(`/provider/${pid}/new-connection`)}
                />
              ))}
            </div>
          ) : (
            <p className="py-2 text-text-sm text-tertiary">No providers match “{query}”.</p>
          )}
        </section>

        {exportOpen && <ExportConfigModal onClose={() => setExportOpen(false)} />}
    </Shell>
  );
}
