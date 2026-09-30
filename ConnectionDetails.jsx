import React, { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { SegmentedTabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { MenuTrigger, Menu, MenuItem, MenuSeparator, Popover } from '@/components/ui/menu';
import { Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { Focusable } from 'react-aria-components';
import { notify } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { IconDismiss, IconCheckCircle, IconSortDown } from '@/icons.jsx';
import { MoreHorizontalIcon } from '@/fluent/MoreHorizontalIcon.jsx';
import { CopyIcon } from '@/fluent/CopyIcon.jsx';
import { DeleteIcon } from '@/fluent/DeleteIcon.jsx';
import { FileCsvIcon } from '@/FileCsvIcon.jsx';
import { useStorage } from './StorageContext.jsx';
import { STATUS_LABELS } from './data.js';

function Metric({ label, value, good }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-secondary p-5 shadow-xs">
      <span className="text-text-sm fg-secondary">{label}</span>
      <div className="flex items-end gap-2">
        <span className="whitespace-nowrap text-display-sm font-semibold text-primary">{value}</span>
        {good && <span className="mb-1.5 fg-success-primary"><IconCheckCircle /></span>}
      </div>
    </div>
  );
}

function StatusPanel({ conn }) {
  const statusText = STATUS_LABELS[conn.status]?.text ?? 'Failed';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-text-xl font-semibold text-primary">Status</h3>
        <p className="text-text-sm text-tertiary">Monitor the current state, health, and activity of this connection.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric label="Connection status" value={statusText} good={conn.status === 'active'} />
        <Metric label="Connection uptime" value={conn.uptime} good={conn.status === 'active'} />
        <Metric label="Bytes sent" value={conn.sent} good={conn.status === 'active'} />
        <Metric label="Bytes received" value={conn.received} good={conn.status === 'active'} />
      </div>
    </div>
  );
}

function formatLine(l) {
  return `[${l.ts}][${l.tid}][${l.level}][${l.drive}] ${l.message}`;
}

function LogsPanel({ conn, onClear }) {
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const rows = (() => {
    const q = query.trim().toLowerCase();
    let list = conn.logs.filter((l) => !q || formatLine(l).toLowerCase().includes(q));
    return [...list].sort((a, b) => (sortDir === 'asc' ? a.ts.localeCompare(b.ts) : b.ts.localeCompare(a.ts)));
  })();

  const copyLine = async (l) => {
    try { await navigator.clipboard.writeText(formatLine(l)); } catch { /* ignore */ }
    notify.success('Log entry copied to clipboard');
  };

  const downloadCsv = () => {
    const header = 'Timestamp,Thread,Level,Drive,Message\n';
    const body = conn.logs.map((l) => `"${l.ts}","${l.tid}","${l.level}","${l.drive}","${l.message.replace(/"/g, '""')}"`).join('\n');
    try {
      const blob = new Blob([header + body], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conn.name}-logs.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { /* prototype: ignore */ }
  };

  // Show a determinate progress notification first; the download + success toast fire once it
  // reaches 100% (Figma 4074-151521 → 4075-153632). Closing the progress toast cancels the export.
  const exportCsv = () => {
    notify.progress('Exporting in CSV...', {
      onComplete: () => {
        downloadCsv();
        notify.success('Logs exported in CSV successfully');
      },
    });
  };

  const copyAll = async () => {
    try { await navigator.clipboard.writeText(conn.logs.map(formatLine).join('\n')); } catch { /* ignore */ }
    notify.success('Logs copied to clipboard successfully');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-text-xl font-semibold text-primary">Logs</h3>
        <p className="text-text-sm text-tertiary">View connection activity, status changes, and error messages for troubleshooting and diagnostics.</p>
      </div>

      <div className="flex items-center gap-3">
        <SearchField className="flex-1" aria-label="Search logs" value={query} onChange={setQuery} />
        <MenuTrigger>
          {/* While the menu is open the trigger is "active" — show the focused state (border + ring)
              regardless of pointer vs keyboard, matching Figma's active-trigger state. */}
          <Button variant="secondary" size="sm" iconOnly aria-label="Log actions" className="aria-expanded:border-brand aria-expanded:ring-brand">
            <MoreHorizontalIcon size={20} />
          </Button>
          <Popover placement="bottom end" className="w-60">
            <Menu onAction={(key) => { if (key === 'export') exportCsv(); else if (key === 'copy') copyAll(); else if (key === 'clear') onClear(); }}>
              <MenuItem id="export" icon={<FileCsvIcon size={20} />}>Export in CSV</MenuItem>
              <MenuItem id="copy" icon={<CopyIcon size={16} />}>Copy to clipboard</MenuItem>
              <MenuSeparator />
              <MenuItem id="clear" icon={<DeleteIcon size={16} />} className="text-error-primary">Clear logs</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>

      {conn.logs.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-primary px-5 py-12 text-center">
          <p className="text-text-md font-semibold text-primary">No logs yet</p>
          <p className="text-text-sm text-tertiary">Logs from this connection will appear here once there is activity.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-secondary">
          <div className="border-b border-secondary bg-secondary px-3 py-2">
            <button type="button" className="inline-flex items-center gap-1 text-text-xs font-semibold text-tertiary" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
              Log entry
              <span className={cn('fg-quaternary transition-transform', sortDir === 'asc' && 'rotate-180')}><IconSortDown /></span>
            </button>
          </div>
          <ul className="max-h-[460px] overflow-y-auto scrollbar-thin">
            {rows.map((l) => (
              <li key={l.id} className="flex items-center gap-2 border-b border-secondary px-3 py-2 last:border-b-0 hover:bg-secondary">
                {/* Hover/focus reveals the full, untruncated raw entry in a tooltip (Figma 4074-151037). */}
                <TooltipTrigger delay={300}>
                  <Focusable>
                    <span className="min-w-0 flex-1 cursor-default truncate rounded-sm font-mono text-text-xs text-primary outline-none focus-visible:ring-brand-focus">
                      {formatLine(l)}
                    </span>
                  </Focusable>
                  <Tooltip placement="top" className="max-w-[340px] whitespace-pre-wrap break-words text-left font-mono font-normal">{formatLine(l)}</Tooltip>
                </TooltipTrigger>
                <button type="button" className="fg-quaternary hover:fg-secondary flex shrink-0 items-center rounded-sm outline-none focus-visible:ring-brand-focus" aria-label="Copy log entry" onClick={() => copyLine(l)}>
                  <CopyIcon size={16} />
                </button>
              </li>
            ))}
            {rows.length === 0 && <li className="px-5 py-5 text-center text-text-sm text-tertiary">No log entries match “{query}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ConnectionDetails({ providerId, conn, onClose }) {
  const { clearLogs } = useStorage();
  const [tab, setTab] = useState('status');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!conn) return null;

  return (
    <>
      <Drawer aria-label={`Details for ${conn.name}`} isOpen isDismissable onOpenChange={(open) => { if (!open) onClose(); }}>
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-display-xs font-semibold text-primary">Details</h2>
            <p className="mt-0.5 text-text-sm text-tertiary">{conn.name}</p>
          </div>
          <Button variant="tertiary" size="sm" iconOnly aria-label="Close details" onPress={onClose}>
            <IconDismiss />
          </Button>
        </header>

        <div className="px-6 pb-4">
          <SegmentedTabs aria-label="Details tabs" fullWidth value={tab} onChange={setTab} tabs={[{ id: 'status', label: 'Status' }, { id: 'logs', label: 'Logs' }]} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin px-6 pt-2 pb-6">
          {tab === 'status' ? <StatusPanel conn={conn} /> : <LogsPanel conn={conn} onClear={() => setConfirmClear(true)} />}
        </div>
      </Drawer>

      <Dialog variant="alertdialog" isOpen={confirmClear} onOpenChange={setConfirmClear} maxWidthClassName="max-w-md">
        <DialogHeader icon={<span className="flex size-12 items-center justify-center rounded-full bg-error-secondary fg-error-primary"><DeleteIcon size={24} /></span>}>
          Clear all logs?
        </DialogHeader>
        <DialogBody>This permanently removes all log entries for “{conn.name}”. This action can’t be undone.</DialogBody>
        <DialogFooter fullWidth>
          <DialogCloseButton label="Cancel" />
          <Button variant="destructive" onPress={() => { clearLogs(providerId, conn.id); setConfirmClear(false); notify.success('Logs cleared'); }}>
            Clear
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
