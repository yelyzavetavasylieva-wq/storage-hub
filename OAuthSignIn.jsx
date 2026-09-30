import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { oauthConfig, startOAuthSignIn } from './oauth.js';

// Interactive OAuth 2 sign-in block for the Authentication step / section. `account` is the
// signed-in identity ('' when not signed in); `onSignedIn(account)` fires after the browser flow
// reports back. Shared by the Add-connection wizard and the Edit-connection page.
// Figma: not signed in 5493-20670 (explainer + secondary "Sign in with …" button with the provider
// mark); signed in 5493-22381 ("Signed in as …" + "Sign in with different account" link).
export function OAuthSignIn({ providerId, providerName, account, onSignedIn }) {
  const cfg = oauthConfig(providerId);
  const { Logo } = cfg;
  const [waiting, setWaiting] = useState(false);
  const signedIn = !!account && !waiting;

  const signIn = async () => {
    setWaiting(true);
    const next = await startOAuthSignIn(providerId);
    setWaiting(false);
    onSignedIn(next);
  };

  return (
    <>
      {/* Half the card width, matching the form fields (w-full sm:w-1/2) on the other steps. */}
      <div className="flex w-full flex-col gap-1 sm:w-1/2">
        <span className="text-text-lg font-semibold text-primary">Sign in with {cfg.account}</span>
        <span className="text-text-md text-tertiary">
          {signedIn
            ? `Signed in as ${account}`
            : `${providerName} uses OAuth 2.0 — no keys or passwords are stored here. A browser window opens so you can sign in to your ${cfg.account} account using whatever your administrator requires (password, MFA, etc.). If you’re already signed in, this may complete without any input.`}
        </span>
      </div>
      {signedIn ? (
        <Button variant="link" className="h-6 self-start p-0" onPress={signIn}>Sign in with different account</Button>
      ) : (
        <Button variant="secondary" className="self-start" onPress={signIn} isDisabled={waiting}>
          <span className="flex size-5 shrink-0 items-center justify-center [&>svg]:max-h-5 [&>svg]:max-w-5"><Logo /></span>
          <span className="px-0.5">{waiting ? 'Waiting for browser sign-in…' : `Sign in with ${cfg.account}`}</span>
        </Button>
      )}
    </>
  );
}
