"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Widget = {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; size: "flexible"; }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
function turnstile() { return (window as Window & { turnstile?: Widget }).turnstile; }

export function useChallenge() {
  const token = useRef<string | undefined>(undefined);
  const trap = useRef<HTMLInputElement>(null);
  const [revision, setRevision] = useState(0);
  return {
    fields: <Challenge token={token} trap={trap} revision={revision} />,
    payload: () => ({ token: token.current, website: trap.current?.value }),
    reset: () => { token.current = undefined; setRevision(value => value + 1); },
  };
}

function Challenge({ token, trap, revision }: {
  token: React.RefObject<string | undefined>;
  trap: React.RefObject<HTMLInputElement | null>;
  revision: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const id = useRef<string | undefined>(undefined);
  useEffect(() => {
    const api = turnstile();
    if (!sitekey || !ready || !api || !box.current) return;
    id.current = api.render(box.current, {
      sitekey, size: "flexible", callback: value => { token.current = value; setFailed(false); },
      "expired-callback": () => { token.current = undefined; },
      "error-callback": () => { token.current = undefined; setFailed(true); },
    });
    const widgetId = id.current;
    return () => { api.remove(widgetId); id.current = undefined; token.current = undefined; };
  }, [ready, token]);
  useEffect(() => {
    if (revision && id.current) turnstile()?.reset(id.current);
  }, [revision]);
  return <>
    <label className="honeypot" aria-hidden="true">Leave blank<input ref={trap} tabIndex={-1} autoComplete="off" /></label>
    {sitekey && <>
      <Script id="bkr-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div ref={box} />
      {failed && <p className="form-error small" role="status">Verification couldn’t load. Refresh the page to try again.</p>}
    </>}
  </>;
}
