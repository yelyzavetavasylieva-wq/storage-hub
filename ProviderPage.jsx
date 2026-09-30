import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchIcon } from '@/fluent/SearchIcon.jsx';
import { PlugConnectedIcon } from '@/fluent/PlugConnectedIcon.jsx';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/components/ui/notification';
import { Switch } from '@/components/ui/switch';
import { MenuTrigger, Menu, MenuItem, MenuSeparator, Popover } from '@/components/ui/menu';
import { Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton } from '@/components/ui/dialog';
import { notify } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { IconSortDown, IconQuestionCircle, IconEdit, IconDismiss } from '@/icons.jsx';
import { AddIcon } from '@/fluent/AddIcon.jsx';
import { MoreHorizontalIcon } from '@/fluent/MoreHorizontalIcon.jsx';
import { InfoIcon } from '@/fluent/InfoIcon.jsx';
import { ArrowClockwiseIcon } from '@/fluent/ArrowClockwiseIcon.jsx';
import { StopIcon } from '@/fluent/StopIcon.jsx';
import Shell from './Shell.jsx';
import ConnectionDetails from './ConnectionDetails.jsx';
import { STATUS_LABELS } from './data.js';
import { useStorage } from './StorageContext.jsx';
import { isOAuthProvider, startOAuthSignIn } from './oauth.js';

const BADGE_COLOR = { green: 'success', gray: 'neutral', red: 'error', orange: 'warning' };

function StatusCell({ status }) {
  const s = STATUS_LABELS[status];
  return <Badge color={BADGE_COLOR[s.tone]}>{s.text}</Badge>;
}

// Per-row overflow menu (Details / Restart / Stop / Edit / Remove from list). OAuth connections whose
// silent token refresh failed also get Reconnect, which re-runs the interactive browser sign-in.
function RowMenu({ conn, onDetails, onStop, onEdit, onRemove, onReconnect }) {
  return (
    <MenuTrigger>
      {/* Bare 20px overflow icon — no button container/hover fill (Figma 4213-140407). */}
      <Button variant="tertiary" size="sm" iconOnly className="size-5 shrink-0 p-0 fg-quaternary! data-hovered:bg-transparent!" aria-label={`Actions for ${conn.name}`}>
        <MoreHorizontalIcon size={20} />
      </Button>
      <Popover placement="bottom end" className="w-60">
        <Menu
          onAction={(key) => {
            if (key === 'reconnect') onReconnect(conn);
            else if (key === 'details') onDetails(conn);
            else if (key === 'stop') onStop(conn);
            else if (key === 'edit') onEdit(conn);
            else if (key === 'remove') onRemove(conn);
          }}
        >
          {onReconnect && <MenuItem id="reconnect" icon={<ArrowClockwiseIcon size={16} />}>Reconnect</MenuItem>}
          <MenuItem id="details" icon={<InfoIcon size={16} />}>Details</MenuItem>
          <MenuItem id="restart" icon={<ArrowClockwiseIcon size={16} />}>Restart</MenuItem>
          <MenuItem id="stop" icon={<StopIcon size={16} />}>Stop</MenuItem>
          <MenuSeparator />
          <MenuItem id="edit" icon={<IconEdit />}>Edit</MenuItem>
          <MenuItem id="remove" icon={<IconDismiss />} className="text-error-primary">Remove from list</MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

export default function ProviderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProvider, removeConnection, setConnectionStatus, setAutoConnect, setAllAutoConnect } = useStorage();
  const provider = getProvider(id);

  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [detailsId, setDetailsId] = useState(null);
  // Connections pending a Stop / Remove confirmation (Figma 4062-139008 / 4062-139943).
  const [stopConn, setStopConn] = useState(null);
  const [removeConn, setRemoveConn] = useState(null);
  // Connection-failure banners the user has closed (session only — they return on reload).
  const [dismissed, setDismissed] = useState([]);

  // Show a confirmation toast when arriving here after adding/editing a connection. Guarded by the
  // navigation's key: StrictMode runs this effect twice, and the second run still sees the old
  // location.state (the replace-navigate below hasn't applied yet), which showed a duplicate toast.
  const toastShownFor = useRef(null);
  useEffect(() => {
    if (location.state?.toast && toastShownFor.current !== location.key) {
      toastShownFor.current = location.key;
      notify.success(location.state.toast);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.key, location.pathname, navigate]);

  const rows = (() => {
    if (!provider) return [];
    const q = query.trim().toLowerCase();
    let list = provider.connections.filter((c) => !q || c.name.toLowerCase().includes(q));
    if (sortDir) {
      list = [...list].sort((a, b) => (sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    }
    return list;
  })();

  if (!provider) return <Navigate to="/" replace />;

  const { Logo } = provider;
  const total = provider.connections.length;
  const configured = total > 0;
  const allOn = total > 0 && provider.connections.every((c) => c.autoConnect);
  // Reconnect = interactive OAuth sign-in; the callback page reports back and the drive mounts.
  const reconnect = async (c) => {
    await startOAuthSignIn(id);
    setConnectionStatus(id, c.id, 'active');
    notify.success(`“${c.name}” reconnected`);
  };
  // Saved-credential connections (key/secret, user/pass) have no login prompt — when one fails to
  // connect at startup the only signal is this warning pointing the user back to its configuration.
  const failed = provider.connections.filter((c) => c.status === 'failed' && !dismissed.includes(c.id));
  const detailsConn = detailsId ? provider.connections.find((c) => c.id === detailsId) : null;

  return (
    <Shell mainClassName="flex flex-col gap-8 p-4 sm:p-8">
        {/* Page header */}
        <section className="flex flex-col gap-5">
          <Breadcrumbs items={[{ label: 'Storage hub', href: '/' }, { label: provider.name }]} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Figma 3946-92054: logo + name grouped 8px apart; the status badge 12px after the group. */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center [&>svg]:max-h-6 [&>svg]:max-w-6"><Logo /></span>
                <h1 className="truncate text-display-xs font-semibold text-primary">{provider.name}</h1>
              </div>
              <Badge color={configured ? 'success' : 'neutral'}>{configured ? 'Configured' : 'Not configured'}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onPress={() => navigate(`/provider/${id}/help`)}>
                <IconQuestionCircle className="size-5" />Help
              </Button>
              <Button variant="primary" onPress={() => navigate(`/provider/${id}/new-connection`)}>
                <AddIcon size={20} />Add connection
              </Button>
            </div>
          </div>
        </section>

        {/* Connection-failure banners — Notification layout (Figma 5544-72066) with the Alert's error fill +
            icon (Figma 2190-105825). */}
        {failed.length > 0 && (
          <section className="flex flex-col gap-3" aria-label="Connection warnings">
            {failed.map((c) => (
              <Notification
                key={c.id}
                state="error"
                title={`Unable to connect to “${c.name}”`}
                actions={[{ label: 'Check configuration', onPress: () => navigate(`/provider/${id}/edit/${c.id}`) }]}
                onDismiss={() => setDismissed((d) => [...d, c.id])}
              >
                Please check your configuration. MyWorkDrive couldn’t connect with the saved settings when it started.
              </Notification>
            ))}
          </section>
        )}

        {/* Auto-connect-all toggle */}
        <section className="flex items-start gap-3 rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <Switch id="auto-connect-all" isSelected={allOn} onChange={(on) => setAllAutoConnect(id, on)} aria-label="Automatically connect all connections" />
          <label htmlFor="auto-connect-all" className="flex cursor-pointer flex-col">
            <span className="text-text-md font-semibold text-primary">Automatically connect all connections</span>
            <span className="text-text-md text-tertiary">Automatically connect all connections for this provider when MyWorkDrive starts.</span>
          </label>
        </section>

        {/* Connections table */}
        <section className="flex flex-col gap-5">
          <SearchField className="w-80 max-w-full" aria-label="Search connections" value={query} onChange={setQuery} />

          {/* Wide table scrolls inside its own container, never the page (WCAG 1.4.10 reflow). */}
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-secondary bg-primary">
            <table className="w-full min-w-[720px] table-fixed border-collapse">
              <colgroup>
                <col />
                <col style={{ width: '220px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '56px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="border-b border-secondary bg-secondary px-4 py-3 text-left align-middle whitespace-nowrap">
                    <button type="button" className="inline-flex items-center gap-1 text-text-xs font-semibold text-tertiary" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                      Name
                      <span className={cn('fg-quaternary transition-transform', sortDir === 'asc' && 'rotate-180')}><IconSortDown /></span>
                    </button>
                  </th>
                  <th className="border-b border-secondary bg-secondary px-4 py-3 text-left text-text-xs font-semibold text-tertiary whitespace-nowrap">Date modified</th>
                  <th className="border-b border-secondary bg-secondary px-4 py-3 text-left text-text-xs font-semibold text-tertiary whitespace-nowrap">Status</th>
                  <th className="border-b border-secondary bg-secondary px-4 py-3 text-left text-text-xs font-semibold text-tertiary whitespace-nowrap">Auto-connect</th>
                  <th className="border-b border-secondary bg-secondary px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((conn) => (
                  <tr key={conn.id} className="last:[&>td]:border-b-0 hover:bg-secondary">
                    <td className="truncate border-b border-secondary px-4 py-3 align-middle text-text-sm font-regular text-primary">{conn.name}</td>
                    <td className="border-b border-secondary px-4 py-3 align-middle text-text-sm whitespace-nowrap text-primary">{conn.modified}</td>
                    <td className="border-b border-secondary px-4 py-3 align-middle"><StatusCell status={conn.status} /></td>
                    <td className="border-b border-secondary px-4 py-3 align-middle">
                      <Switch isSelected={conn.autoConnect} onChange={(on) => setAutoConnect(id, conn.id, on)} aria-label={`Auto-connect ${conn.name}`} />
                    </td>
                    <td className="border-b border-secondary px-4 py-3 text-right align-middle">
                      <RowMenu
                        conn={conn}
                        onDetails={(c) => setDetailsId(c.id)}
                        onStop={(c) => setStopConn(c)}
                        onEdit={(c) => navigate(`/provider/${id}/edit/${c.id}`)}
                        onRemove={(c) => setRemoveConn(c)}
                        onReconnect={isOAuthProvider(id) && conn.status === 'reconnect' ? reconnect : undefined}
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    {/* Empty state template (Figma 2391-100408). */}
                    <td className="p-0" colSpan={5}>
                      {total === 0 ? (
                        <EmptyState
                          icon={<PlugConnectedIcon size={24} />}
                          title="No connections yet"
                          description={`Add your first ${provider.name} connection to make its storage available in MyWorkDrive`}
                          actionLabel="Add connection"
                          actionIcon={<AddIcon size={20} />}
                          onAction={() => navigate(`/provider/${id}/new-connection`)}
                        />
                      ) : (
                        <EmptyState
                          icon={<SearchIcon size={24} />}
                          title="No connections found"
                          description={`No connections match “${query}”. Try a different search.`}
                          actionLabel="Clear search"
                          onAction={() => setQuery('')}
                        />
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      {detailsConn && <ConnectionDetails providerId={id} conn={detailsConn} onClose={() => setDetailsId(null)} />}

      {/* Stop connection confirmation (Figma 4062-139008). */}
      <Dialog variant="alertdialog" isOpen={!!stopConn} onOpenChange={(open) => { if (!open) setStopConn(null); }} maxWidthClassName="max-w-md">
        <DialogHeader>Stop connection?</DialogHeader>
        <DialogBody>This will stop the connection and disconnect access to the associated storage. You can start the connection again at any time.</DialogBody>
        <DialogFooter fullWidth>
          <DialogCloseButton label="Cancel" />
          <Button variant="destructive" onPress={() => { setConnectionStatus(id, stopConn.id, 'stopped'); notify.success(`“${stopConn.name}” connection stopped`); setStopConn(null); }}>
            Stop
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Remove-from-list confirmation (Figma 4062-139943). */}
      <Dialog variant="alertdialog" isOpen={!!removeConn} onOpenChange={(open) => { if (!open) setRemoveConn(null); }} maxWidthClassName="max-w-md">
        <DialogHeader>Remove connection from list?</DialogHeader>
        <DialogBody>This will remove the connection from MyWorkDrive. The underlying storage and its data will remain unchanged.</DialogBody>
        <DialogFooter fullWidth>
          <DialogCloseButton label="Cancel" />
          <Button variant="destructive" onPress={() => { removeConnection(id, removeConn.id); notify.success(`“${removeConn.name}” removed from list`); setRemoveConn(null); }}>
            Remove
          </Button>
        </DialogFooter>
      </Dialog>
    </Shell>
  );
}
