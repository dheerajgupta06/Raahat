import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { translate } from '../lib/i18n.js';
import { NETWORK_CENTER, describeCoordinates } from '../lib/locations.js';
import { readJSON, writeJSON, removeKey } from '../lib/cache.js';
import { api } from '../lib/api.js';
import { useOnline } from '../hooks/useOnline.js';

const STORE = {
  lang: 'raahat.lang',
  theme: 'raahat.theme',
  largeText: 'raahat.largeText',
  location: 'raahat.location.v1',
  auth: 'raahat.auth.v1',
};

const AppContext = createContext(null);

function initialLang() {
  const stored = readJSON(STORE.lang, null);
  if (stored === 'hi' || stored === 'en') return stored;
  try {
    return navigator.language?.toLowerCase().startsWith('hi') ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

function initialTheme() {
  const stored = readJSON(STORE.theme, null);
  return stored === 'light' ? 'light' : 'dark';
}

function initialLargeText() {
  return readJSON(STORE.largeText, false) === true;
}

function loadLocation() {
  const stored = readJSON(STORE.location, null);
  if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lng)) return stored;
  return { ...NETWORK_CENTER };
}

function loadAuth() {
  const stored = readJSON(STORE.auth, null);
  if (stored?.token && stored.admin) return stored;
  return null;
}

export function AppProvider({ children }) {
  const online = useOnline();
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);
  const [largeText, setLargeTextState] = useState(initialLargeText);
  const [location, setLocation] = useState(loadLocation);
  const [geoStatus, setGeoStatus] = useState(() =>
    loadLocation().source === 'gps' ? 'ready' : 'idle'
  );
  const [problemId, setProblemId] = useState(null);
  const [severity, setSeverity] = useState('critical');
  const [sosOpen, setSosOpen] = useState(false);
  const [auth, setAuth] = useState(loadAuth);
  const [toasts, setToasts] = useState([]);
  const toastSeq = useRef(0);
  const detectedOnce = useRef(false);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, tone = 'info', ttl = 3800) => {
      if (!message) return null;
      toastSeq.current += 1;
      const id = toastSeq.current;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, ttl);
      return id;
    },
    []
  );

  const setLang = useCallback((next) => {
    const value = next === 'hi' ? 'hi' : 'en';
    setLangState(value);
    writeJSON(STORE.lang, value);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'hi' : 'en');
  }, [lang, setLang]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setLargeText = useCallback((next) => {
    setLargeTextState(Boolean(next));
  }, []);

  const toggleLargeText = useCallback(() => {
    setLargeTextState((prev) => !prev);
  }, []);

  const persistLocation = useCallback((next) => {
    setLocation(next);
    writeJSON(STORE.location, next);
  }, []);

  const selectLocality = useCallback(
    (locality) => {
      persistLocation({
        lat: locality.lat,
        lng: locality.lng,
        label: locality.name,
        city: locality.city || '',
        source: 'manual',
      });
      setGeoStatus('manual');
    },
    [persistLocation]
  );

  const detectLocation = useCallback(
    async ({ silent = false } = {}) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeoStatus('unavailable');
        if (!silent) pushToast(translate(lang, 'triage.locationUnavailable'), 'warn');
        return null;
      }

      setGeoStatus('locating');
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const description = describeCoordinates(latitude, longitude);
            const next = {
              lat: Number(latitude.toFixed(5)),
              lng: Number(longitude.toFixed(5)),
              label: description.label,
              city: description.city,
              source: 'gps',
            };
            persistLocation(next);
            setGeoStatus('ready');
            resolve(next);
          },
          (error) => {
            const denied = error?.code === 1;
            setGeoStatus(denied ? 'denied' : 'unavailable');
            if (!silent) {
              pushToast(
                translate(lang, denied ? 'triage.permissionDenied' : 'triage.locationUnavailable'),
                'warn'
              );
            }
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 9000, maximumAge: 5 * 60 * 1000 }
        );
      });
    },
    [lang, persistLocation, pushToast]
  );

  // Try once on first paint when we have no real fix yet, so the first search
  // is already centred on the user without an extra tap.
  useEffect(() => {
    if (detectedOnce.current) return;
    detectedOnce.current = true;
    if (location.source !== 'gps') {
      const timer = window.setTimeout(() => detectLocation({ silent: true }), 900);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.login(email, password);
    const session = {
      token: response.token,
      admin: response.data.admin,
      hospital: response.data.hospital,
    };
    setAuth(session);
    writeJSON(STORE.auth, session);
    return session;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.register(payload);
    const session = {
      token: response.token,
      admin: response.data.admin,
      hospital: response.data.hospital,
    };
    setAuth(session);
    writeJSON(STORE.auth, session);
    return session;
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    removeKey(STORE.auth);
  }, []);

  const updateSessionHospital = useCallback((hospital) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const next = { ...prev, hospital };
      writeJSON(STORE.auth, next);
      return next;
    });
  }, []);

  const beginEmergency = useCallback(
    ({ problem = problemId || 'other', severity: level = severity, radius = 25 } = {}) => {
      const query = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        problem,
        severity: level,
        radius: String(radius),
      });
      return `/hospitals?${query.toString()}`;
    },
    [location, problemId, severity]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeJSON(STORE.theme, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#040812');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
    writeJSON(STORE.largeText, largeText);
  }, [largeText]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      theme,
      setTheme,
      toggleTheme,
      largeText,
      setLargeText,
      toggleLargeText,
      location,
      geoStatus,
      detectLocation,
      selectLocality,
      persistLocation,
      problemId,
      setProblemId,
      severity,
      setSeverity,
      beginEmergency,
      sosOpen,
      openSos: () => setSosOpen(true),
      closeSos: () => setSosOpen(false),
      auth,
      login,
      register,
      logout,
      updateSessionHospital,
      online,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      lang,
      setLang,
      toggleLang,
      t,
      theme,
      setTheme,
      toggleTheme,
      largeText,
      setLargeText,
      toggleLargeText,
      location,
      geoStatus,
      detectLocation,
      selectLocality,
      persistLocation,
      problemId,
      severity,
      beginEmergency,
      sosOpen,
      auth,
      login,
      register,
      logout,
      updateSessionHospital,
      online,
      toasts,
      pushToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
