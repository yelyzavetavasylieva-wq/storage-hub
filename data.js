import {
  LogoS3, LogoOneDrive, LogoAzureBlob, LogoSharePoint, LogoAzureFiles,
  LogoDropbox, LogoGoogleDrive, LogoBackblaze, LogoBox, LogoCloudflare,
  LogoDigitalOcean, LogoSFTP, LogoWasabi, LogoWebDAV,
} from '@/logos.jsx';
import { isOAuthProvider, oauthConfig } from './oauth.js';

// Provider catalog — each maps to a MyWorkDrive storage type with its brand
// logo. `seedCount` is how many sample connections to generate; a provider is
// "Configured" once it has ≥1 connection. Order + counts mirror Figma 5417-62245.
export const PROVIDERS = [
  { id: 'azure-blob', name: 'Azure Blob', Logo: LogoAzureBlob, seedCount: 1 },
  { id: 'azure-files', name: 'Azure Files', Logo: LogoAzureFiles, seedCount: 0 },
  { id: 'backblaze', name: 'Backblaze', Logo: LogoBackblaze, seedCount: 9 },
  { id: 'box', name: 'Box', Logo: LogoBox, seedCount: 1 },
  { id: 'cloudflare', name: 'Cloudflare', Logo: LogoCloudflare, seedCount: 0 },
  { id: 'digitalocean', name: 'DigitalOcean', Logo: LogoDigitalOcean, seedCount: 0 },
  { id: 'dropbox', name: 'Dropbox', Logo: LogoDropbox, seedCount: 0 },
  { id: 'google-drive', name: 'Google Drive', Logo: LogoGoogleDrive, seedCount: 4 },
  { id: 'onedrive', name: 'OneDrive', Logo: LogoOneDrive, seedCount: 5 },
  { id: 'sftp', name: 'SFTP', Logo: LogoSFTP, seedCount: 4 },
  { id: 's3', name: 'S3', Logo: LogoS3, seedCount: 11 },
  { id: 'wasabi', name: 'Wasabi', Logo: LogoWasabi, seedCount: 0 },
  { id: 'webdav', name: 'WebDAV', Logo: LogoWebDAV, seedCount: 0 },
];

export const STATUS_LABELS = {
  active: { text: 'Active', tone: 'green' },
  stopped: { text: 'Stopped', tone: 'gray' },
  failed: { text: 'Failed', tone: 'red' },
  // OAuth providers only: the silent token refresh at startup failed (or no token is stored), so the
  // user must sign in again interactively before the drive can mount.
  reconnect: { text: 'Reconnect required', tone: 'orange' },
};

// Pools used to synthesize believable sample connections per provider.
const NAME_POOL = [
  'ArchiveNode-02', 'BackupNode-A', 'Departmental_Secure_Finance_Audit_Files',
  'DeptFS-ENG', 'DFS-Projects', 'FS-Prod01', 'Media-Cache-01', 'Legal-Hold-2025',
  'HR-Onboarding', 'Eng-Builds', 'Sales-Reports-2026',
];
const STATUS_POOL = ['active', 'stopped', 'failed', 'active', 'stopped', 'stopped', 'active', 'stopped', 'active', 'failed', 'active'];
const DATE_POOL = [
  '05/20/2026, 1:37:44 PM', '05/19/2026, 2:48:39 AM', '05/18/2026, 6:22:11 PM',
  '05/17/2026, 9:01:55 AM', '05/16/2026, 11:49:23 PM', '—', '05/15/2026, 8:10:02 AM',
  '05/14/2026, 4:33:47 PM', '05/13/2026, 7:19:30 AM', '05/12/2026, 1:05:12 PM',
  '05/11/2026, 10:58:41 AM',
];

const UPTIME_POOL = ['10 days', '3 days', '27 days', '1 day', '16 days', '8 hours', '2 days', '45 days'];
const SENT_POOL = ['120 B', '4.2 KB', '1.1 MB', '512 B', '88 KB', '2.4 MB', '340 KB'];
const RECV_POOL = ['55 B', '2.1 KB', '940 KB', '128 B', '12 KB', '5.6 MB', '76 KB'];

// Drive label used inside each connection's log lines, e.g. "[S3Drive]".
export const DRIVE_LABELS = {
  's3': 'S3Drive', 'onedrive': 'OneDrive', 'azure-blob': 'AzureBlob',
  'azure-files': 'AzureFiles', 'dropbox': 'Dropbox', 'google-drive': 'GDrive',
  'sharepoint': 'SharePoint', 'smb': 'SMBDrive', 'backblaze': 'B2Drive',
  'box': 'BoxDrive', 'cloudflare': 'R2Drive', 'digitalocean': 'SpacesDrive',
  'sftp': 'SFTPDrive', 'wasabi': 'WasabiDrive', 'webdav': 'WebDAVDrive',
};

const LOG_TEMPLATES = [
  ['ERROR', 'Mounting error: the target directory is not empty.'],
  ['INFO', 'Syncing files to the cloud: 45 files remaining.'],
  ['WARNING', 'Disk space low: 5% remaining.'],
  ['INFO', 'Successfully mounted volume at /user/data.'],
  ['ERROR', 'Insufficient permissions: cannot write to target.'],
  ['ERROR', 'File not found: /user/data/file.txt.'],
  ['WARNING', 'Connection timeout: retrying in 5s.'],
  ['SUCCESS', 'File upload completed: /user/docs/report.pdf.'],
  ['INFO', 'Downloading update: version 2.1.0.'],
  ['SUCCESS', 'Update installed successfully.'],
  ['INFO', 'Restarting service to apply changes.'],
  ['NOTICE', 'Service restarted successfully.'],
  ['INFO', 'Cache cleared: 128 MB reclaimed.'],
  ['WARNING', 'Rate limit reached: throttling requests.'],
  ['SUCCESS', 'Credentials refreshed successfully.'],
  ['INFO', 'Health check passed.'],
  ['ERROR', 'Checksum mismatch on /user/data/archive.zip.'],
  ['INFO', 'Background indexing completed.'],
];

const pad = (n) => String(n).padStart(2, '0');
function fmtStamp(d) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Build the sample log lines for one connection.
export function makeLogs(providerId, seed = 0) {
  const drive = DRIVE_LABELS[providerId] || 'Drive';
  return LOG_TEMPLATES.map(([level, message], i) => {
    const d = new Date(2026, 5, 5, 6, 22, 48);
    d.setSeconds(d.getSeconds() + (i + seed) * 137);
    return {
      id: `${providerId}-${seed}-log-${i}`,
      ts: fmtStamp(d),
      tid: `TID=${pad(4 + ((i + seed) % 20))}`,
      level,
      drive,
      message,
    };
  });
}

// Metrics + logs attached to a fresh connection.
export function connectionExtras(providerId, i) {
  return {
    uptime: UPTIME_POOL[i % UPTIME_POOL.length],
    sent: SENT_POOL[i % SENT_POOL.length],
    received: RECV_POOL[i % RECV_POOL.length],
    logs: makeLogs(providerId, i),
  };
}

// Deterministically build `count` sample connections for a provider.
// OAuth connections fail as "Reconnect required" (expired/revoked token) rather than a generic
// failure, and carry the signed-in account.
export function makeConnections(providerId, count) {
  const oauth = isOAuthProvider(providerId);
  return Array.from({ length: count }, (_, i) => ({
    id: `${providerId}-conn-${i + 1}`,
    name: NAME_POOL[i % NAME_POOL.length],
    modified: DATE_POOL[i % DATE_POOL.length],
    status: oauth && STATUS_POOL[i % STATUS_POOL.length] === 'failed' ? 'reconnect' : STATUS_POOL[i % STATUS_POOL.length],
    ...(oauth && { account: oauthConfig(providerId).sampleAccount }),
    autoConnect: i % 3 !== 2,
    ...connectionExtras(providerId, i),
  }));
}

// Frequently used connections — the horizontally-scrolling row on the hub.
const FREQ = 'Modified on 05/20/2026, 1:37:44 PM';
export const FREQUENT_CONNECTIONS = [
  { id: 'archivenode-02', name: 'ArchiveNode-02', Logo: LogoOneDrive, status: 'active', modified: FREQ },
  { id: 'backupnode-a', name: 'BackupNode-A', Logo: LogoSharePoint, status: 'stopped', modified: FREQ },
  { id: 'dept-secure', name: 'Departmental_Secure_Finance_Audit_Files', Logo: LogoGoogleDrive, status: 'failed', modified: FREQ },
  { id: 'deptfs-eng', name: 'DeptFS-ENG', Logo: LogoAzureBlob, status: 'active', modified: FREQ },
  { id: 'dfs-projects', name: 'DFS-Projects', Logo: LogoDropbox, status: 'stopped', modified: FREQ },
  { id: 's3-archive', name: 'S3-ColdArchive', Logo: LogoS3, status: 'active', modified: FREQ },
];
