import { useEffect, useRef, useState } from 'react';
import { encodeRoute, decodeRoute } from '../lib/encode';
import type { Day } from './routeStore';

export function useUrlSync(days: Day[], onLoad: (days: Day[]) => void) {
  const [hashSize, setHashSize] = useState(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    decodeRoute(hash).then((loaded) => {
      const hasPoints = loaded.some((d) => d.points.length > 0);
      if (hasPoints) {
        onLoad(loaded);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });
  }, [onLoad]);

  useEffect(() => {
    if (!loadedRef.current) return;
    const handle = setTimeout(async () => {
      const encoded = await encodeRoute(days);
      setHashSize(encoded.length);
      const newHash = `#${encoded}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash || window.location.pathname);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [days]);

  return hashSize;
}
