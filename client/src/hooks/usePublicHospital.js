import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { readCachedHospital } from '../lib/cache.js';
import { useHospitalUpdates } from './useHospitalUpdates.js';

export function usePublicHospital(id, coords) {
  const [state, setState] = useState(() => {
    const cached = id ? readCachedHospital(id) : null;
    return { hospital: cached, loading: !cached, error: null, cached: Boolean(cached) };
  });
  const [reloadKey, setReloadKey] = useState(0);
  const lat = coords?.lat;
  const lng = coords?.lng;

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: !prev.hospital, error: null }));

    api
      .hospital(id, Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined)
      .then((payload) => {
        if (cancelled) return;
        setState({ hospital: payload.data, loading: false, error: null, cached: false });
      })
      .catch((error) => {
        if (cancelled) return;
        const cached = readCachedHospital(id);
        if (cached) {
          setState({ hospital: cached, loading: false, error: null, cached: true });
        } else {
          setState({ hospital: null, loading: false, error, cached: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, lat, lng, reloadKey]);

  useHospitalUpdates((payload) => {
    setState((prev) => {
      if (!prev.hospital || prev.hospital.id !== payload.id) return prev;
      return { ...prev, hospital: { ...prev.hospital, ...payload } };
    });
  });

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}
