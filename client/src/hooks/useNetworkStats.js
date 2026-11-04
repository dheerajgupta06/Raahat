import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { readStats, saveStats } from '../lib/cache.js';
import { useHospitalUpdates } from './useHospitalUpdates.js';

export function useNetworkStats() {
  const cached = readStats();
  const [stats, setStats] = useState(cached?.data || null);
  const [loading, setLoading] = useState(!cached?.data);
  const [offline, setOffline] = useState(false);
  const debounceRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const payload = await api.stats();
      saveStats(payload);
      setStats(payload.data);
      setOffline(false);
    } catch {
      const fallback = readStats();
      if (fallback?.data) {
        setStats(fallback.data);
        setOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 90 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  useHospitalUpdates(() => {
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(load, 1200);
  });

  return { stats, loading, offline };
}
