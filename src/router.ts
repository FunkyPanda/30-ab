import { useEffect, useState } from 'react';

/** Minimal hash router – works on GitHub Pages without server rewrites. */
export function useHashRoute(): string[] {
  const parse = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [segments, setSegments] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setSegments(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return segments;
}

export function navigate(path: string): void {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}

/** Navigates without adding a history entry (so "back" skips the current page). */
export function replaceRoute(path: string): void {
  window.history.replaceState(null, '', `#${path}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function goBack(fallback = '/'): void {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}
