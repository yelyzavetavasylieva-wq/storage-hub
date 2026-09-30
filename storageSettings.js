// Provider-specific connection schemas, split the same way the wizard is:
// - AUTH_SETTINGS    → the Authentication step (saved credentials).
// - STORAGE_SETTINGS → the Storage Settings step (where the data lives).
//
// Three auth models (product spec):
// - OAuth 2 (Azure Files/Blob, OneDrive, Google Drive, Box, Dropbox) — interactive browser sign-in,
//   see oauth.js. No auth fields here.
// - Saved key/secret (S3, Wasabi, Backblaze, Cloudflare, DigitalOcean) — the user saves credentials
//   once at setup and they're used silently at every app start. No login prompt; the only auth UI is
//   the setup-time "Test connection" check and a warning if a later startup fails to connect.
// - Saved user/pass (WebDAV) — same principle as key/secret: configured once, run at startup.
//
// Field shape: { key, label, type: 'text'|'password'|'select', required?, options?, default?,
//   width?: 'small' (fixed 160px) | 'half' (default, 50%), dividerBefore?, hint? (helper text) }

// ─── S3-compatible family ───────────────────────────────────────────────────────────────────────
// Every provider names its credentials differently; we normalize them to "Access key" / "Secret key"
// and use the hint to tell the user what their provider calls them.
function keyFields(accessName, secretName, vendor) {
  return [
    { key: 'accessKey', label: 'Access key', type: 'password', required: true, default: 'AKIAIOSFODNN7EXAMPLE', hint: accessName && `Called “${accessName}” in ${vendor}.` },
    { key: 'secretKey', label: 'Secret key', type: 'password', required: true, default: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', hint: secretName && `Called “${secretName}” in ${vendor}.` },
  ];
}

const region = (options) => ({ key: 'region', label: 'Region', type: 'select', required: true, options, default: options[0] });
const BUCKET = { key: 'bucket', label: 'Bucket', type: 'text', required: true, default: 'mybucket-name' };

const AWS_REGIONS = ['us-east-1 — US East (N. Virginia)', 'us-east-2 — US East (Ohio)', 'us-west-2 — US West (Oregon)', 'eu-west-1 — Europe (Ireland)', 'eu-central-1 — Europe (Frankfurt)', 'ap-southeast-2 — Asia Pacific (Sydney)'];
const WASABI_REGIONS = ['us-east-1 — US East (N. Virginia)', 'us-east-2 — US East 2 (N. Virginia)', 'us-central-1 — US Central (Texas)', 'us-west-1 — US West (Oregon)', 'eu-central-1 — Europe (Amsterdam)', 'ap-northeast-1 — Asia Pacific (Tokyo)'];
const B2_REGIONS = ['us-west-001', 'us-west-002', 'us-west-004', 'us-east-005', 'eu-central-003'];
const DO_REGIONS = ['nyc3 — New York', 'sfo3 — San Francisco', 'ams3 — Amsterdam', 'fra1 — Frankfurt', 'sgp1 — Singapore', 'syd1 — Sydney'];
const R2_JURISDICTIONS = ['Default', 'EU', 'FedRAMP'];

// ─── Authentication step ────────────────────────────────────────────────────────────────────────
export const AUTH_SETTINGS = {
  s3: keyFields('Access Key ID', 'Secret Access Key', 'AWS'),
  wasabi: keyFields(null, null),
  digitalocean: keyFields(null, null),
  backblaze: keyFields('keyID (Application Key ID)', 'Application Key', 'Backblaze B2'),
  cloudflare: keyFields('Access Key ID', 'Secret Access Key', 'Cloudflare R2'),
  webdav: [
    { key: 'username', label: 'Username', type: 'text', required: true, default: 'admin' },
    { key: 'password', label: 'Password', type: 'password', required: true, default: 'S3cur3P@ssw0rd' },
    { key: 'authScheme', label: 'Authentication scheme', type: 'select', required: true, options: ['Basic', 'Digest', 'NTLM', 'Negotiate (Kerberos)'], default: 'Basic' },
  ],
};

// ─── Storage Settings step ──────────────────────────────────────────────────────────────────────
const AZURE_HINT = 'Enter the name exactly as it appears in Azure — it can’t be looked up automatically.';

export const STORAGE_SETTINGS = {
  s3: [region(AWS_REGIONS), BUCKET],
  wasabi: [region(WASABI_REGIONS), BUCKET],
  digitalocean: [region(DO_REGIONS), BUCKET],
  backblaze: [region(B2_REGIONS), BUCKET],
  // Cloudflare R2 has no Region — it's addressed by Account ID (+ optional jurisdiction) instead.
  cloudflare: [
    { key: 'accountId', label: 'Account ID', type: 'text', required: true, default: '023e105f4ecef8ad9ca31a8372d0c353' },
    BUCKET,
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', required: true, options: R2_JURISDICTIONS, default: 'Default' },
  ],

  // OAuth 2 group (see oauth.js) — credentials come from browser sign-in, never from this form.
  // Azure can't reliably look the storage account / share / container up for a regular user (that
  // needs admin permissions in Azure), so the user types them by name. The rest need no settings.
  'azure-blob': [
    { key: 'accountName', label: 'Storage account name', type: 'text', required: true, default: '', hint: AZURE_HINT },
    { key: 'container', label: 'Container name', type: 'text', required: true, default: '' },
  ],
  'azure-files': [
    { key: 'accountName', label: 'Storage account name', type: 'text', required: true, default: '', hint: AZURE_HINT },
    { key: 'fileShare', label: 'File share name', type: 'text', required: true, default: '' },
  ],
  onedrive: [],
  box: [],
  // "My Drive" only — Shared Drive (needs a Shared Drive ID) is deliberately out of scope for now.
  'google-drive': [],
  // Personal/member folder only — Team space is deliberately out of scope for now.
  dropbox: [],

  sftp: [
    { key: 'host', label: 'Host', type: 'text', required: true, default: 'sftp.example.com' },
    { key: 'port', label: 'Port', type: 'text', required: true, width: 'small', default: '22' },
    { key: 'username', label: 'Username', type: 'text', required: true, default: 'admin' },
    { key: 'password', label: 'Password', type: 'password', required: true, default: 'S3cur3P@ssw0rd' },
    { key: 'privateKeyPath', label: 'Private key path', type: 'text', default: '', dividerBefore: true },
    { key: 'rootPath', label: 'Root path', type: 'text', default: '/' },
  ],
  webdav: [
    { key: 'remoteUrl', label: 'Remote URL', type: 'text', required: true, default: 'https://dav.example.com' },
  ],
};

export const storageFieldsFor = (providerId) => STORAGE_SETTINGS[providerId] || [];
// null → the provider has no saved-credential form (OAuth, or not yet specced).
export const authFieldsFor = (providerId) => AUTH_SETTINGS[providerId] || null;

// ─── Generic helpers over a field list ──────────────────────────────────────────────────────────
// Seed a values object with each field's example default.
export function defaultValues(fields) {
  const out = {};
  for (const f of fields || []) out[f.key] = f.default ?? '';
  return out;
}

// Complete once every required field has a non-empty value.
export function fieldsComplete(fields, values) {
  return (fields || []).every((f) => !f.required || String(values?.[f.key] ?? '').trim() !== '');
}

// Rows for the Review summary table — password fields render masked with a reveal toggle.
export function reviewRows(fields, values) {
  return (fields || []).map((f) => [
    f.label,
    f.type === 'password' ? { secret: values?.[f.key] ?? '' } : (values?.[f.key] ?? ''),
  ]);
}

export const defaultStorageSettings = (providerId) => defaultValues(storageFieldsFor(providerId));
export const storageSettingsComplete = (providerId, values) => fieldsComplete(storageFieldsFor(providerId), values);
export const storageSettingsReviewRows = (providerId, values) => reviewRows(storageFieldsFor(providerId), values);
