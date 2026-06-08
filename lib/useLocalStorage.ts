"use client";

import { useEffect, useState } from "react";

// SSR-safe: starts from `initial`, hydrates from localStorage on mount, then
// persists on change. `loaded` lets callers avoid acting on the pre-hydration
// default (e.g. don't overwrite saved state with the seed).
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
