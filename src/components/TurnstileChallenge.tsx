import { useEffect, useRef } from 'react';

type Props = { siteKey: string; onToken: (token: string) => void };
type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

export default function TurnstileChallenge({ siteKey, onToken }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  useEffect(() => {
    if (!siteKey) return;
    let active = true;
    let widgetId: string | undefined;
    const mount = () => {
      if (!active || !container.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      });
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
    script.addEventListener('load', mount);
    mount();
    return () => {
      active = false;
      script?.removeEventListener('load', mount);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenRef.current('');
    };
  }, [siteKey]);
  return <div ref={container} aria-label="Security verification" />;
}
