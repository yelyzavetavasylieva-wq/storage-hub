// OAuth 2 provider group — Azure Files, Azure Blob, OneDrive, Google Drive, Box and Dropbox.
// None of these take keys/secrets in the wizard: the user signs in to their provider account in the
// system browser (like "Sign in with Microsoft" in MyWorkDrive) and the app keeps a refreshable token.
//
// Lifecycle (product spec):
// - App start: for each configured connection, look for a stored token and try a silent refresh —
//   success mounts the drive with no user input; no token / refresh failure → "Reconnect required".
// - Interactive auth (first configure, or Reconnect): open the browser at the provider's authorize
//   page → login (skipped if a session already exists) → consent (if the provider shows it) →
//   redirect back to the app's "You're connected, you can close this window" page, which flips the
//   connection to connected.
//
// Prototype only — no real OAuth. `startOAuthSignIn` opens the in-app callback page in a new window
// and resolves when that page reports success over a BroadcastChannel.

import { LogoGoogle, LogoMicrosoft, LogoBox, LogoDropbox } from '@/logos.jsx';

// `account` is the identity provider the user signs in with; `sampleAccount` is the fake signed-in
// identity shown after a successful sign-in. `scopeNote` explains the default scope for providers
// where a non-default option (Shared Drive / Team space) exists but is deliberately out of scope.
// `Logo` is the mark on the sign-in button — the identity provider's mark: Google "G" (Figma 5493-20670),
// Microsoft (Figma 2185-126743); Box and Dropbox use their own brand logos.
export const OAUTH_PROVIDERS = {
  'azure-files': { account: 'Microsoft', Logo: LogoMicrosoft, sampleAccount: 'user@contoso.com' },
  'azure-blob': { account: 'Microsoft', Logo: LogoMicrosoft, sampleAccount: 'user@contoso.com' },
  'onedrive': { account: 'Microsoft', Logo: LogoMicrosoft, sampleAccount: 'user@contoso.com' },
  'google-drive': { account: 'Google', Logo: LogoGoogle, sampleAccount: 'user@contoso.com', scopeNote: 'The connection opens your My Drive.' },
  'box': { account: 'Box', Logo: LogoBox, sampleAccount: 'user@contoso.com' },
  'dropbox': { account: 'Dropbox', Logo: LogoDropbox, sampleAccount: 'user@contoso.com', scopeNote: 'The connection opens your personal (member) folder.' },
};

export const isOAuthProvider = (providerId) => providerId in OAUTH_PROVIDERS;
export const oauthConfig = (providerId) => OAUTH_PROVIDERS[providerId] || null;

const CHANNEL = 'storage-hub-oauth';
export const OAUTH_CALLBACK_PATH = '/oauth/callback';

// Called by the callback page once the (simulated) provider redirect lands back in the app.
export function reportOAuthSuccess(providerId, account) {
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ providerId, account });
    ch.close();
  } catch { /* BroadcastChannel unsupported — the opener's fallback timer covers it */ }
}

// Kick off interactive sign-in: open the "browser" window and wait for the callback page to report
// back. Resolves with the signed-in account. Falls back to a short timer if the popup is blocked or
// BroadcastChannel is unavailable, so the prototype flow never dead-ends.
export function startOAuthSignIn(providerId) {
  const cfg = oauthConfig(providerId);
  return new Promise((resolve) => {
    let ch = null;
    let fallback = null;
    const done = (account) => {
      clearTimeout(fallback);
      ch?.close();
      resolve(account || cfg?.sampleAccount || '');
    };
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (e) => { if (e.data?.providerId === providerId) done(e.data.account); };
    } catch { ch = null; }

    const win = window.open(`${OAUTH_CALLBACK_PATH}?provider=${encodeURIComponent(providerId)}`, '_blank', 'width=520,height=640');
    if (!win || !ch) fallback = setTimeout(() => done(), 1500);
  });
}
