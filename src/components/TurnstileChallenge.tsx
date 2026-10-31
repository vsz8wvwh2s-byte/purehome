import { useEffect, useRef, useState } from 'react';

type Props = { siteKey: string; onToken: (token: string) => void };
type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

export default function TurnstileChallenge({ siteKey, onToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [loadError, setLoadError] = useState(false);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    let widgetId: string | undefined;
    let poll: number | undefined;
    const mount = () => {
      if (!active || !container.current || !window.turnstile || widgetId !== undefined) return;
      try {
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: (token: string) => { if (active) onTokenRef.current(token); },
          'expired-callback': () => { if (active) onTokenRef.current(''); },
          'error-callback': () => { if (active) { onTokenRef.current(''); setLoadError(true); } },
        });
        setLoadError(false);
        if (poll !== undefined) window.clearInterval(poll);
      } catch {
        setLoadError(true);
      }
    };
    const scriptId = 'purehome-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const scriptFailed = () => { if (active) setLoadError(true); };
    script.addEventListener('load', mount);
    script.addEventListener('error', scriptFailed);
    mount();
    // The shared script can finish loading before a new component attaches.
    if (widgetId === undefined) poll = window.setInterval(mount, 250);
    const deadline = window.setTimeout(() => {
      if (active && widgetId === undefined) {
        setLoadError(true);
        if (poll !== undefined) window.clearInterval(poll);
      }
    }, 10000);
    return () => {
      active = false;
      if (poll !== undefined) window.clearInterval(poll);
      window.clearTimeout(deadline);
      script?.removeEventListener('load', mount);
      script?.removeEventListener('error', scriptFailed);
      if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  return <div>
    <div ref={container} aria-label="Security verification" />
    {loadError && <p role="alert">Security verification is unavailable. Please refresh the page and try again later.</p>}
  </div>;
}
