import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { ChevronDownIcon } from '@/fluent/ChevronDownIcon.jsx';
import { FolderIcon } from '@/fluent/FolderIcon.jsx';
import { EyeIcon } from '@/fluent/EyeIcon.jsx';
import { EyeOffIcon } from '@/fluent/EyeOffIcon.jsx';
import Shell from './Shell.jsx';
import { StorageSettingsFields } from './StorageSettingsFields.jsx';
import { defaultStorageSettings } from './storageSettings.js';
import { useStorage } from './StorageContext.jsx';
import { OAuthSignIn } from './OAuthSignIn.jsx';
import { isOAuthProvider } from './oauth.js';
import { authFieldsFor, defaultValues, storageFieldsFor } from './storageSettings.js';

const DRIVE_LETTERS = ['M:', 'N:', 'O:', 'P:', 'Z:', 'Y:', 'X:', 'W:'];
const DRIVE_TYPE_OPTIONS = ['Network Drive', 'Fixed Drive', 'Removable Drive'];
const PROXY_OPTIONS = ['No proxy', 'HTTP', 'SOCKS5'];

// Bare label used by composite fields (password, browse, tags) that aren't a plain TextField.
function FieldLabel({ children }) {
  return <label className="text-text-sm font-semibold text-secondary">{children}</label>;
}

// A 1px rule in the card's border color, separating field groups within a section.
const Divider = () => <div className="border-t border-secondary" />;

function PasswordField({ label, value, onChange, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <input
          className="h-10 w-full rounded-md border border-primary bg-primary pr-11 pl-2.5 text-text-md text-primary shadow-xs outline-none focus:border-brand focus:ring-brand"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="fg-quaternary absolute top-1/2 right-2.5 -translate-y-1/2 hover:fg-secondary" aria-label={show ? 'Hide' : 'Show'} onClick={() => setShow((s) => !s)}>
          {show ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
        </button>
      </div>
    </div>
  );
}

// Small numeric field with the native stepper (Figma shows up/down arrows on these).
function NumberField({ label, value, onChange }) {
  return <TextField type="number" label={label} className="w-40" value={value} onChange={onChange} />;
}

// Collapsible section card. All sections start expanded (Figma "Expanded sections"); the header
// toggles them and the chevron points down when open, right when collapsed.
function Section({ title, open, onToggle, children }) {
  return (
    <section className="rounded-xl border border-secondary bg-primary shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-6 py-6 text-left outline-none focus-visible:ring-brand-focus"
      >
        <ChevronDownIcon size={20} className={cn('fg-quaternary transition-transform', !open && '-rotate-90')} />
        <span className="text-text-md font-semibold text-primary">{title}</span>
      </button>
      {open && <div className="-mt-1 flex flex-col gap-5 px-6 pb-6">{children}</div>}
    </section>
  );
}

export default function EditConnectionPage() {
  const { id, connId } = useParams();
  const navigate = useNavigate();
  const { getProvider, updateConnection } = useStorage();
  const provider = getProvider(id);
  const conn = provider?.connections.find((c) => c.id === connId) || null;

  const [open, setOpen] = useState({
    drive: true, storage: true, auth: true, advanced: true, cache: true, license: true,
  });
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const [f, setF] = useState({
    // Drive Details
    driveName: conn?.name || '',
    driveLetter: 'M:',
    // Storage Settings — provider-specific fields (S3 family, Azure, OneDrive, Box, Dropbox, …).
    settings: defaultStorageSettings(id),
    // Authentication — OAuth providers keep only the signed-in account.
    oauthAccount: conn?.account || '',
    // Saved credentials (S3 family key/secret, WebDAV user/pass).
    auth: defaultValues(authFieldsFor(id)),
    useAwsProfile: true,
    awsProfileDir: '~/aws',
    useEc2Role: false,
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    // Advanced
    driveType: 'Network Drive',
    readOnly: false,
    sharedDrive: false,
    openRemoteOnConnect: false,
    folderToOpen: '',
    caseSensitiveNames: false,
    caseInsensitiveCache: false,
    queryAvailableSpace: false,
    fixedAvailableSpace: '0',
    useVirtualHosting: false,
    useTransferAcceleration: false,
    useServerSideEncryption: false,
    useAsyncTransfer: false,
    enableGetBucketLocation: false,
    enableReadConflict: false,
    enableWriteConflict: false,
    useIpv6: false,
    imdsVersion: '1',
    imdsSessionDuration: '21600',
    proxyType: 'No proxy',
    // Cache
    enableReadCache: false,
    cacheDirectory: 'C:\\ProgramData\\S3Drive\\',
    threadsPerFile: '10',
    preDownloadCount: '10',
    smallFileLimit: '10240',
    maxUploads: '30',
    uploadThreadsPerFile: '10',
    uploadDelay: '120',
    uploadDelayThreshold: '0',
    maxRetries: '3',
    deleteDelay: '120',
    infoValidity: '120',
    fragmentSize: '120',
    largeFileThreshold: '1048576',
    // License
    licenseKey: '',
  });

  if (!provider) return <Navigate to="/" replace />;
  if (!conn) return <Navigate to={`/provider/${id}`} replace />;

  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: value }));
  const setSetting = (key, value) => setF((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  const oauth = isOAuthProvider(id);
  const authFields = authFieldsFor(id);
  const setAuth = (key, value) => setF((prev) => ({ ...prev, auth: { ...prev.auth, [key]: value } }));
  const save = () => {
    updateConnection(id, connId, { name: f.driveName.trim(), ...(oauth && { account: f.oauthAccount }) });
    navigate(`/provider/${id}`, { state: { toast: `“${f.driveName.trim()}” connection updated` } });
  };

  return (
    <Shell mainClassName="flex flex-col p-4 sm:p-8">
      <div className="flex w-full flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-5">
          <Breadcrumbs items={[{ label: 'Storage hub', href: '/' }, { label: provider.name, href: `/provider/${id}` }, { label: 'Edit connection' }]} />
          <h1 className="text-display-xs font-semibold text-primary">Edit connection</h1>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          <Section title="Drive Details" open={open.drive} onToggle={() => toggle('drive')}>
            <TextField label="Drive name" isRequired className="w-full sm:w-1/2" value={f.driveName} onChange={set('driveName')} />
            <Select label="Drive letter" isRequired className="w-40" selectedKey={f.driveLetter} onSelectionChange={(k) => set('driveLetter')(String(k))}>
              {DRIVE_LETTERS.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
            </Select>
          </Section>

          {/* Providers with no storage settings (OneDrive, Box, Google Drive, Dropbox) skip this section. */}
          {storageFieldsFor(id).length > 0 && (
            <Section title="Storage Settings" open={open.storage} onToggle={() => toggle('storage')}>
              <StorageSettingsFields providerId={id} values={f.settings} onChange={setSetting} />
            </Section>
          )}

          <Section title="Authentication" open={open.auth} onToggle={() => toggle('auth')}>
            {oauth ? (
              <OAuthSignIn
                providerId={id}
                providerName={provider.name}
                account={conn.status === 'reconnect' && f.oauthAccount === conn.account ? '' : f.oauthAccount}
                onSignedIn={(a) => { set('oauthAccount')(a); if (conn.status === 'reconnect') updateConnection(id, connId, { status: 'active', account: a }); }}
              />
            ) : authFields ? (
              <StorageSettingsFields fields={authFields} values={f.auth} onChange={setAuth} />
            ) : (
            <>
            <Checkbox isSelected={f.useAwsProfile} onChange={set('useAwsProfile')}>Use AWS profile</Checkbox>
            <div className="flex w-full flex-col gap-1.5 sm:w-1/2">
              <FieldLabel>AWS Profile Directory</FieldLabel>
              <div className="flex items-stretch">
                <input className="h-10 min-w-0 flex-1 rounded-l-md border border-primary bg-primary px-2.5 text-text-md text-primary shadow-xs outline-none focus:z-10 focus:border-brand focus:ring-brand" value={f.awsProfileDir} onChange={(e) => set('awsProfileDir')(e.target.value)} />
                <Button variant="secondary" className="-ml-px rounded-l-none"><FolderIcon size={20} />Browse</Button>
              </div>
            </div>
            <Divider />
            <Checkbox isSelected={f.useEc2Role} onChange={set('useEc2Role')}>Use EC2 role credentials</Checkbox>
            <PasswordField label="Access key" className="sm:w-1/2" value={f.accessKey} onChange={set('accessKey')} />
            <PasswordField label="Secret key" className="sm:w-1/2" value={f.secretKey} onChange={set('secretKey')} />
            </>
            )}
          </Section>

          <Section title="Advanced" open={open.advanced} onToggle={() => toggle('advanced')}>
            <Select label="Drive type" className="w-full sm:w-1/2" selectedKey={f.driveType} onSelectionChange={(k) => set('driveType')(String(k))}>
              {DRIVE_TYPE_OPTIONS.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
            </Select>
            <Checkbox isSelected={f.readOnly} onChange={set('readOnly')}>Read only</Checkbox>
            <Checkbox isSelected={f.sharedDrive} onChange={set('sharedDrive')}>Shared Drive</Checkbox>
            <Checkbox isSelected={f.openRemoteOnConnect} onChange={set('openRemoteOnConnect')}>Open remote folder on Connect</Checkbox>
            <Divider />
            <TextField label="Folder to open" className="w-full sm:w-1/2" placeholder="e.g., documents/projects" value={f.folderToOpen} onChange={set('folderToOpen')} />
            <Checkbox isSelected={f.caseSensitiveNames} onChange={set('caseSensitiveNames')}>Case sensitive names</Checkbox>
            <Checkbox isSelected={f.caseInsensitiveCache} onChange={set('caseInsensitiveCache')}>Case insensitive cache</Checkbox>
            <Checkbox isSelected={f.queryAvailableSpace} onChange={set('queryAvailableSpace')}>Query available space</Checkbox>
            <Divider />
            <NumberField label="Fixed available space" value={f.fixedAvailableSpace} onChange={set('fixedAvailableSpace')} />
            <Checkbox isSelected={f.useVirtualHosting} onChange={set('useVirtualHosting')}>Use virtual hosting</Checkbox>
            <Checkbox isSelected={f.useTransferAcceleration} onChange={set('useTransferAcceleration')}>Use transfer acceleration</Checkbox>
            <Checkbox isSelected={f.useServerSideEncryption} onChange={set('useServerSideEncryption')}>Use server side encryption</Checkbox>
            <Checkbox isSelected={f.useAsyncTransfer} onChange={set('useAsyncTransfer')}>Use asynchronous transfer mode</Checkbox>
            <Checkbox isSelected={f.enableGetBucketLocation} onChange={set('enableGetBucketLocation')}>Enable “Get bucket” location</Checkbox>
            <Checkbox isSelected={f.enableReadConflict} onChange={set('enableReadConflict')}>Enable Read conflict detection</Checkbox>
            <Checkbox isSelected={f.enableWriteConflict} onChange={set('enableWriteConflict')}>Enable Write conflict detection</Checkbox>
            <Checkbox isSelected={f.useIpv6} onChange={set('useIpv6')}>Use IPv6</Checkbox>
            <Divider />
            <NumberField label="IMDS version" value={f.imdsVersion} onChange={set('imdsVersion')} />
            <NumberField label="IMDS session duration (sec)" value={f.imdsSessionDuration} onChange={set('imdsSessionDuration')} />
            <Divider />
            <Select label="Proxy type" className="w-full sm:w-1/2" selectedKey={f.proxyType} onSelectionChange={(k) => set('proxyType')(String(k))}>
              {PROXY_OPTIONS.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
            </Select>
          </Section>

          <Section title="Cache" open={open.cache} onToggle={() => toggle('cache')}>
            <Checkbox isSelected={f.enableReadCache} onChange={set('enableReadCache')}>Enable read cache</Checkbox>
            <div className="flex w-full flex-col gap-1.5 sm:w-1/2">
              <FieldLabel>Cache files only</FieldLabel>
              <div className="flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-2.5 shadow-xs">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <Badge color="neutral">*.tmp:*</Badge>
                  <Badge color="neutral">.log</Badge>
                </div>
                <ChevronDownIcon size={20} className="fg-quaternary shrink-0" />
              </div>
            </div>
            <TextField label="Cache Directory" className="w-full sm:w-1/2" value={f.cacheDirectory} onChange={set('cacheDirectory')} />
            <Divider />
            <NumberField label="Threads per file" value={f.threadsPerFile} onChange={set('threadsPerFile')} />
            <NumberField label="Pre-download count" value={f.preDownloadCount} onChange={set('preDownloadCount')} />
            <NumberField label="Small file limit (byte)" value={f.smallFileLimit} onChange={set('smallFileLimit')} />
            <Divider />
            <NumberField label="Max uploads" value={f.maxUploads} onChange={set('maxUploads')} />
            <NumberField label="Upload threads per file" value={f.uploadThreadsPerFile} onChange={set('uploadThreadsPerFile')} />
            <NumberField label="Upload delay (sec)" value={f.uploadDelay} onChange={set('uploadDelay')} />
            <NumberField label="Upload delay threshold" value={f.uploadDelayThreshold} onChange={set('uploadDelayThreshold')} />
            <Divider />
            <NumberField label="Max retries" value={f.maxRetries} onChange={set('maxRetries')} />
            <Divider />
            <NumberField label="Delete delay (sec)" value={f.deleteDelay} onChange={set('deleteDelay')} />
            <NumberField label="Info validity (sec)" value={f.infoValidity} onChange={set('infoValidity')} />
            <Divider />
            <NumberField label="Fragment size (bytes)" value={f.fragmentSize} onChange={set('fragmentSize')} />
            <NumberField label="Large file threshold" value={f.largeFileThreshold} onChange={set('largeFileThreshold')} />
          </Section>

          <Section title="License" open={open.license} onToggle={() => toggle('license')}>
            <TextField label="License key" className="w-full sm:w-1/2" placeholder="e.g., x12-3456a" value={f.licenseKey} onChange={set('licenseKey')} />
          </Section>
        </div>

        {/* Save — the breadcrumb link back to the provider is the cancel affordance (Figma 4041-146988). */}
        <div className="flex justify-end">
          <Button variant="primary" onPress={save}>Save</Button>
        </div>
      </div>
    </Shell>
  );
}
