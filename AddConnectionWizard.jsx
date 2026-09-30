import React, { useState, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { IconEdit } from '@/icons.jsx';
import { EyeIcon } from '@/fluent/EyeIcon.jsx';
import { EyeOffIcon } from '@/fluent/EyeOffIcon.jsx';
import { FolderIcon } from '@/fluent/FolderIcon.jsx';
import { CheckmarkCircleIcon } from '@/fluent/CheckmarkCircleIcon.jsx';
import { DismissCircleIcon } from '@/fluent/DismissCircleIcon.jsx';
import { ArrowClockwiseIcon } from '@/fluent/ArrowClockwiseIcon.jsx';
import Shell from './Shell.jsx';
import { StorageSettingsFields } from './StorageSettingsFields.jsx';
import { OAuthSignIn } from './OAuthSignIn.jsx';
import { authFieldsFor, defaultStorageSettings, defaultValues, fieldsComplete, reviewRows, storageFieldsFor, storageSettingsComplete, storageSettingsReviewRows } from './storageSettings.js';
import { isOAuthProvider, oauthConfig } from './oauth.js';
import { useStorage } from './StorageContext.jsx';

const STEPS = ['Drive Details', 'Authentication', 'Storage Settings', 'Review & Confirm'];
const DRIVE_LETTERS = ['M:', 'N:', 'O:', 'P:', 'Z:', 'Y:', 'X:', 'W:'];

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Progress steps — each step base is a label-width column with its 24px circle centered over the
// centered label (Figma _Step base 4002-77906), spread edge-to-edge with justify-between. Connector
// lines are measured to run circle-center → circle-center (so they meet the circles with no gap) and
// turn blue for every segment leading out of a completed step, tracing the trail up to the current
// step (Figma 4002-77900).
function WizardStepper({ current, onStep }) {
  const rowRef = useRef(null);
  const circleRefs = useRef([]);
  const [segments, setSegments] = useState([]);

  useLayoutEffect(() => {
    function measure() {
      const row = rowRef.current;
      if (!row) return;
      const base = row.getBoundingClientRect();
      const centers = circleRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect();
        return r.left - base.left + r.width / 2;
      });
      const next = [];
      for (let i = 0; i < centers.length - 1; i++) next.push({ left: centers[i], width: centers[i + 1] - centers[i] });
      setSegments(next);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={rowRef} className="relative flex items-start justify-between">
      {/* Connector segments sit behind the circles; each runs from one circle's center to the next. */}
      {segments.map((s, i) => (
        <div
          key={i}
          className={cn('absolute top-[11px] h-0.5 rounded-full', i < current ? 'bg-brand-solid' : 'bg-secondary')}
          style={{ left: s.left, width: s.width }}
          aria-hidden="true"
        />
      ))}
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming';
        const circle = (
          <span
            ref={(el) => { circleRefs.current[i] = el; }}
            className={cn(
              'relative z-10 flex size-6 items-center justify-center rounded-full bg-primary',
              state === 'upcoming' && 'border-[1.5px] border-secondary bg-active',
              state === 'current' && 'bg-brand-solid ring-brand',
              state === 'done' && 'bg-brand-solid text-white',
            )}
          >
            {state === 'done' ? <Check /> : <span className={cn('size-2 rounded-full', state === 'current' ? 'bg-white' : 'bg-gray-300')} />}
          </span>
        );
        return (
          <div className="relative z-10 flex flex-col items-center gap-3" key={label}>
            {i < current ? (
              <button type="button" className="inline-flex outline-none" onClick={() => onStep(i)} aria-label={`Go to ${label}`}>{circle}</button>
            ) : circle}
            <span className={cn('hidden text-center text-text-sm font-semibold sm:block', state === 'current' ? 'text-brand-primary' : 'text-primary')}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Bare label used by the custom composite fields (password, browse) that aren't a plain TextField.
function FieldLabel({ children }) {
  return <label className="text-text-sm font-semibold text-secondary">{children}</label>;
}

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

// A 1px rule in the border-secondary color (matches the card's own border), not a bg fill.
const Divider = () => <div className="border-t border-secondary" />;

export default function AddConnectionWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProvider, addConnection } = useStorage();
  const provider = getProvider(id);

  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    driveName: provider ? `${provider.name} Drive` : '',
    driveLetter: 'M:',
    // Saved-credential providers (S3 family key/secret, WebDAV user/pass): provider-specific fields.
    auth: defaultValues(authFieldsFor(id)),
    // Legacy AWS-style block, still used by providers without an auth schema yet (SFTP).
    useAwsProfile: true,
    awsProfileDir: '~/aws',
    useEc2Role: false,
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    connectAuto: true,
    // OAuth providers: the account signed in through the browser flow ('' until signed in).
    oauthAccount: '',
    // Provider-specific storage settings (S3 family, Azure, OneDrive, Box, Dropbox, Google, SFTP, WebDAV).
    settings: defaultStorageSettings(id),
  });
  const [testState, setTestState] = useState('idle');

  if (!provider) return <Navigate to="/" replace />;

  const oauth = isOAuthProvider(id);
  const authFields = authFieldsFor(id);
  const hasSettings = storageFieldsFor(id).length > 0;
  const set = (key, value) => setF((prev) => ({ ...prev, [key]: value }));
  // Any credential/settings edit invalidates a previous successful connection test.
  const setSetting = (key, value) => { setTestState('idle'); setF((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } })); };
  const setAuth = (key, value) => { setTestState('idle'); setF((prev) => ({ ...prev, auth: { ...prev.auth, [key]: value } })); };

  const canNext = (() => {
    if (step === 0) return f.driveName.trim() && f.driveLetter;
    // OAuth: interactive sign-in must succeed before moving on.
    if (step === 1 && oauth) return !!f.oauthAccount;
    if (step === 1 && authFields) return fieldsComplete(authFields, f.auth);
    // Required fields filled AND a passing "Test connection" (any edit resets the test). Providers with
    // no storage settings (OneDrive, Box, Google Drive, Dropbox) show no test, so nothing to gate on.
    if (step === 2) return !hasSettings || (storageSettingsComplete(id, f.settings) && testState === 'valid');
    return true;
  })();

  // Prototype check: there's no backend, so the test fails whenever any entered credential or setting
  // contains "fail" (e.g. bucket "fail-bucket") — lets the failed state be demoed/usability-tested.
  const runTest = () => {
    setTestState('testing');
    const values = [...Object.values(f.settings), ...Object.values(f.auth)];
    const fails = values.some((v) => /fail/i.test(String(v)));
    setTimeout(() => setTestState(fails ? 'failed' : 'valid'), 900);
  };

  const confirm = () => {
    addConnection(id, { name: f.driveName, autoConnect: f.connectAuto, ...(oauth && { account: f.oauthAccount }) });
    navigate(`/provider/${id}`, { state: { toast: `“${f.driveName.trim()}” connection added` } });
  };

  return (
    <Shell mainClassName="flex flex-col p-4 sm:p-8">
        {/* Vertical rhythm per Figma 3951-93948: 40px between header, stepper and body; 32px within the body. */}
        <div className="flex w-full flex-col gap-10">
          <div className="flex flex-col gap-5">
            <Breadcrumbs items={[{ label: 'Storage hub', href: '/' }, { label: provider.name, href: `/provider/${id}` }, { label: 'Add connection' }]} />
            <h1 className="text-display-xs font-semibold text-primary">Add connection</h1>
          </div>

          <WizardStepper current={step} onStep={setStep} />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
            {/* Step 1 — Drive Details */}
            {step === 0 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-display-xs font-semibold text-primary">Drive Details</h2>
                  <p className="text-text-md text-tertiary">Name your drive and, if supported, assign a drive letter that users will see when accessing it.</p>
                </div>
                <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                  <TextField label="Drive name" isRequired className="w-full sm:w-1/2" value={f.driveName} onChange={(v) => set('driveName', v)} />
                  <Select label="Drive letter" isRequired className="w-40" selectedKey={f.driveLetter} onSelectionChange={(k) => set('driveLetter', String(k))}>
                    {DRIVE_LETTERS.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
                  </Select>
                </div>
              </>
            )}

            {/* Step 2 — Authentication */}
            {step === 1 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-display-xs font-semibold text-primary">Authentication</h2>
                  <p className="text-text-md text-tertiary">{oauth
                    ? 'Sign in to your account to authorize MyWorkDrive to connect to your storage.'
                    : authFields
                      ? 'Enter the credentials for this connection. They’re saved and used automatically each time MyWorkDrive starts — there’s no separate sign-in.'
                      : 'Provide the credentials required to establish a secure connection to your storage.'}</p>
                </div>
                <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                  {oauth ? (
                    <OAuthSignIn providerId={id} providerName={provider.name} account={f.oauthAccount} onSignedIn={(a) => set('oauthAccount', a)} />
                  ) : authFields ? (
                    // Saved credentials — no login prompt; they're stored and used silently at every app start.
                    <StorageSettingsFields fields={authFields} values={f.auth} onChange={setAuth} />
                  ) : (
                  <>
                  <Checkbox isSelected={f.useAwsProfile} onChange={(v) => set('useAwsProfile', v)}>Use AWS profile</Checkbox>
                  <div className="flex w-full flex-col gap-1.5 sm:w-1/2">
                    <FieldLabel>AWS Profile Directory</FieldLabel>
                    <div className="flex items-stretch">
                      <input className="h-10 min-w-0 flex-1 rounded-l-md border border-primary bg-primary px-2.5 text-text-md text-primary shadow-xs outline-none focus:z-10 focus:border-brand focus:ring-brand" value={f.awsProfileDir} onChange={(e) => set('awsProfileDir', e.target.value)} />
                      <Button variant="secondary" className="-ml-px rounded-l-none"><FolderIcon size={20} />Browse</Button>
                    </div>
                  </div>
                  <Divider />
                  <Checkbox isSelected={f.useEc2Role} onChange={(v) => set('useEc2Role', v)}>Use EC2 role credentials</Checkbox>
                  <PasswordField label="Access key" className="sm:w-1/2" value={f.accessKey} onChange={(v) => set('accessKey', v)} />
                  <PasswordField label="Secret key" className="sm:w-1/2" value={f.secretKey} onChange={(v) => set('secretKey', v)} />
                  </>
                  )}
                  <Divider />
                  <div className="flex w-full items-start gap-3 sm:w-1/2">
                    <Switch isSelected={f.connectAuto} onChange={(v) => set('connectAuto', v)} aria-label="Connect automatically on startup" />
                    <span className="flex flex-col">
                      <span className="text-text-md font-semibold text-primary">Connect automatically on startup</span>
                      <span className="text-text-md text-tertiary">{authFields
                        ? 'Automatically connect this connection with the saved credentials when MyWorkDrive starts.'
                        : 'Automatically connect this connection when MyWorkDrive starts. You may still be prompted to sign in if authentication is required.'}</span>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Storage Settings */}
            {step === 2 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-display-xs font-semibold text-primary">Configure storage settings</h2>
                  <p className="text-text-md text-tertiary">Enter the details required to access and configure your selected storage.</p>
                </div>
                <div className="flex flex-col gap-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs">
                  {!hasSettings ? (
                    // OneDrive, Box, Google Drive (My Drive), Dropbox (personal folder): sign-in is all it takes.
                    // Same title + supporting-text structure as the sign-in block (Figma 5493-22515).
                    <div className="flex w-full flex-col gap-1 sm:w-1/2">
                      <span className="text-text-lg font-semibold text-primary">No storage settings required</span>
                      <span className="text-text-md text-tertiary">
                        Your {oauthConfig(id)?.account ?? provider.name} sign-in is all {provider.name} needs.
                        {oauthConfig(id)?.scopeNote && ` ${oauthConfig(id).scopeNote}`}
                      </span>
                    </div>
                  ) : (
                  <>
                  <StorageSettingsFields providerId={id} values={f.settings} onChange={setSetting} />
                  <div className="flex items-center">
                    {testState === 'valid' ? (
                      <span className="inline-flex items-center gap-1.5 text-text-md font-regular fg-success-primary"><CheckmarkCircleIcon size={20} />Access is valid</span>
                    ) : testState === 'failed' ? (
                      <div role="alert" className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-text-md font-semibold text-error-primary"><DismissCircleIcon size={16} className="fg-error-primary" />Unable to connect to {provider.name}</span>
                        <span className="text-text-sm text-tertiary">Please check your configuration — the credentials and storage settings — and test again.</span>
                        <Button variant="link" className="h-auto gap-1.5 self-start p-0" onPress={runTest}><ArrowClockwiseIcon size={20} />Test again</Button>
                      </div>
                    ) : (
                      <Button variant="link" className="h-auto gap-1.5 p-0" onPress={runTest} isDisabled={testState === 'testing' || !storageSettingsComplete(id, f.settings)}>
                        <CheckmarkCircleIcon size={20} />{testState === 'testing' ? 'Testing connection…' : 'Test connection'}
                      </Button>
                    )}
                  </div>
                  </>
                  )}
                </div>
              </>
            )}

            {/* Step 4 — Review & Confirm */}
            {step === 3 && (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-display-xs font-semibold text-primary">Review &amp; Confirm</h2>
                  <p className="text-text-md text-tertiary">Review the settings for this connection. To change something, click Edit in the corresponding section — you’ll be brought back there before creating the connection.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <ReviewCard title="1. Drive Details" onEdit={() => setStep(0)} rows={[['Drive name', f.driveName], ['Drive letter', f.driveLetter]]} />
                  <ReviewCard title="2. Authentication" onEdit={() => setStep(1)} rows={oauth ? [
                    ['Authentication method', `OAuth 2.0 (${oauthConfig(id).account} sign-in)`],
                    ['Signed in as', f.oauthAccount],
                    ['Connect automatically on startup', f.connectAuto ? 'Enabled' : 'Disabled'],
                  ] : authFields ? [
                    ...reviewRows(authFields, f.auth),
                    ['Connect automatically on startup', f.connectAuto ? 'Enabled' : 'Disabled'],
                  ] : [
                    ['Use AWS Profile', f.useAwsProfile ? 'Enabled' : 'Disabled'],
                    ['AWS Profile Directory', f.awsProfileDir],
                    ['Access key', { secret: f.accessKey }],
                    ['Secret key', { secret: f.secretKey }],
                    ['Connect automatically on startup', f.connectAuto ? 'Enabled' : 'Disabled'],
                  ]} />
                  <ReviewCard title="3. Storage Settings" onEdit={() => setStep(2)} rows={hasSettings ? storageSettingsReviewRows(id, f.settings) : [['Storage settings', 'None required']]} />
                </div>
                {/* Alert, Info state, Simple type without close button (Figma 2190-105778). */}
                <Alert state="info">This wizard includes only the required settings. Additional configuration options are available from the connection’s settings after setup.</Alert>
              </>
            )}
            </div>

            <div className="flex items-center justify-between">
              {step > 0 ? (
                <Button variant="secondary" onPress={() => setStep(step - 1)}>Back</Button>
              ) : (
                <Button variant="secondary" onPress={() => navigate(`/provider/${id}`)}>Cancel</Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button variant="primary" isDisabled={!canNext} onPress={() => setStep(step + 1)}>Next</Button>
              ) : (
                <Button variant="primary" onPress={confirm}>Confirm &amp; add</Button>
              )}
            </div>
          </div>
        </div>
    </Shell>
  );
}

function SecretValue({ value }) {
  const [show, setShow] = useState(false);
  return (
    // Value on the left, show/hide toggle pushed to the right edge of the cell (Figma review table).
    <span className="flex w-full items-center justify-between gap-2">
      <span className="truncate tracking-wider">{show ? value : '•'.repeat(28)}</span>
      <button type="button" className="fg-quaternary hover:fg-secondary shrink-0" aria-label={show ? 'Hide' : 'Show'} onClick={() => setShow((s) => !s)}>
        {show ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
      </button>
    </span>
  );
}

function ReviewCard({ title, onEdit, rows }) {
  return (
    <div className="rounded-xl border border-secondary bg-primary p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-text-md font-semibold text-primary">{title}</h3>
        <Button variant="secondary" size="sm" onPress={onEdit}><IconEdit />Edit</Button>
      </div>
      {/* The table is its own bordered box, inset by the card's 24px padding, with a vertical divider
          between the Field and Value columns (Figma 3951-126717). */}
      <div className="mt-4 overflow-hidden rounded-lg border border-secondary">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-80 border-b border-r border-secondary bg-secondary px-4 py-3 text-left text-text-xs font-semibold text-tertiary">Field</th>
              <th className="border-b border-secondary bg-secondary px-4 py-3 text-left text-text-xs font-semibold text-tertiary">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([field, value]) => (
              <tr key={field} className="last:[&>td]:border-b-0">
                <td className="border-b border-r border-secondary px-4 py-3 align-top text-text-sm text-tertiary">{field}</td>
                <td className="border-b border-secondary px-4 py-3 align-top text-text-sm text-secondary">
                  {value && typeof value === 'object' && 'secret' in value ? <SecretValue value={value.secret} /> : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
