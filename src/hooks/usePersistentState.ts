import { useState, useEffect, useCallback } from 'react';

export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && initial && typeof initial === 'object') {
          return { ...(initial as object), ...(parsed as object) } as T;
        }
        return parsed as T;
      }
    } catch { /* ignore corrupt storage */ }
    return initial;
  });

  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore quota errors */ }
  }, [key, state]);

  const clear = useCallback(() => {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  return [state, setState, clear] as const;
}
