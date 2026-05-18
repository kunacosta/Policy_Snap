'use client';

import { useEffect, useState } from 'react';

// html2canvas can drop <img> tags whose src is a path (CORS pre-flight,
// next/image lazy-decoding, Capacitor file:// quirks). Inlining as a data
// URL guarantees the image is embedded in the cloned DOM at capture time.
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

async function fetchAsDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export function useImageDataUrl(path: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(() => cache.get(path) ?? null);

  useEffect(() => {
    if (cache.has(path)) {
      setDataUrl(cache.get(path)!);
      return;
    }
    let cancelled = false;
    const pending = inflight.get(path) ?? (() => {
      const p = fetchAsDataUrl(path).then(url => {
        cache.set(path, url);
        inflight.delete(path);
        return url;
      }).catch(err => {
        inflight.delete(path);
        throw err;
      });
      inflight.set(path, p);
      return p;
    })();

    pending.then(url => { if (!cancelled) setDataUrl(url); }).catch(() => {});
    return () => { cancelled = true; };
  }, [path]);

  return dataUrl;
}
