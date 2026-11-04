import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { readLastResults, readResults, saveResults } from '../lib/cache.js';
import { useHospitalUpdates } from './useHospitalUpdates.js';

export function useNearbyHospitals({ lat, lng, radius, problem, severity, online }) {
  const params = useMemo(
    () => ({ lat, lng, radius: Number(radius), problem, severity }),
    [lat, lng, radius, problem, severity]
  );
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const abortRef = useRef(null);

  const [state, setState] = useState({
    data: [],
    meta: null,
    loading: true,
    refreshing: false,
    error: null,
    cached: false,
    savedAt: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async ({ background = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const activeParams = { ...paramsRef.current };

    setState((prev) => ({
      ...prev,
      loading: !background,
      refreshing: background,
      error: background ? prev.error : null,
    }));

    try {
      const payload = await api.nearby(activeParams, { signal: controller.signal });
      if (controller.signal.aborted) return;
      saveResults(activeParams, payload);
      setState({
        data: payload.data || [],
        meta: payload.meta || null,
        loading: false,
        refreshing: false,
        error: null,
        cached: false,
        savedAt: null,
      });
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      const exact = readResults(activeParams);
      const fallback = exact || readLastResults();
      if (fallback) {
        setState({
          data: fallback.data || [],
          meta: fallback.meta || null,
          loading: false,
          refreshing: false,
          error: null,
          cached: true,
          savedAt: fallback.savedAt || null,
        });
      } else {
        setState({
          data: [],
          meta: null,
          loading: false,
          refreshing: false,
          error,
          cached: false,
          savedAt: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load, reloadKey, params.lat, params.lng, params.radius, params.problem, params.severity]);

  useEffect(() => {
    if (online && state.cached) setReloadKey((key) => key + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useHospitalUpdates((payload) => {
    setState((prev) => {
      if (!prev.data.some((hospital) => hospital.id === payload.id)) return prev;
      return {
        ...prev,
        data: prev.data.map((hospital) =>
          hospital.id === payload.id ? { ...hospital, ...payload, rank: hospital.rank } : hospital
        ),
      };
    });
  });

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const refresh = useCallback(() => load({ background: true }), [load]);

  return { ...state, params, reload, refresh };
}
