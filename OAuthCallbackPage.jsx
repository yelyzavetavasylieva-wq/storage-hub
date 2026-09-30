import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckmarkCircleIcon } from '@/fluent/CheckmarkCircleIcon.jsx';
import { oauthConfig, reportOAuthSuccess } from './oauth.js';
import { PROVIDERS } from './data.js';

// The page the provider's OAuth redirect lands on, opened in the user's browser during interactive
// sign-in. In the real product the provider's own login/consent pages come first; the prototype
// shows a brief "Signing in…" state in their place, then the success message and notifies the app.
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const providerId = params.get('provider') || '';
  const provider = PROVIDERS.find((p) => p.id === providerId);
  const cfg = oauthConfig(providerId);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!cfg) return undefined;
    const t = setTimeout(() => {
      reportOAuthSuccess(providerId, cfg.sampleAccount);
      setConnected(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [providerId, cfg]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-secondary bg-primary p-8 text-center shadow-xs">
        {provider && <span className="flex size-10 items-center justify-center [&>svg]:max-h-10 [&>svg]:max-w-10"><provider.Logo /></span>}
        {!cfg ? (
          <p className="text-text-md text-tertiary">This sign-in link is not valid.</p>
        ) : connected ? (
          <>
            <span className="fg-success-primary"><CheckmarkCircleIcon size={32} /></span>
            <h1 className="text-text-xl font-semibold text-primary">You’re connected</h1>
            <p className="text-text-md text-tertiary">You can close this window and return to MyWorkDrive.</p>
          </>
        ) : (
          <>
            <h1 className="text-text-xl font-semibold text-primary">Signing in to {cfg.account}…</h1>
            <p className="text-text-md text-tertiary">Complete any sign-in or consent steps required by your administrator.</p>
          </>
        )}
      </div>
    </main>
  );
}
