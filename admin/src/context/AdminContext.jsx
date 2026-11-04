import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN, api } from '../lib/api';

const STORAGE_KEY = 'raahat.control.token';
const AdminContext = createContext(null);

let toastId = 0;

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(Boolean(token));
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [liveTick, setLiveTick] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const socketRef = useRef(null);
  const timersRef = useRef(new Map());

  const pushToast = useCallback(({ title, message, tone = 'info' }) => {
    const id = ++toastId;
    setToasts((list) => [...list.slice(-3), { id, title, message, tone }]);
    const timer = setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
      timersRef.current.delete(id);
    }, 6000);
    timersRef.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    socketRef.current?.close();
    socketRef.current = null;
    setToken(null);
    setAdmin(null);
    setNotifications([]);
    setUnread(0);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    localStorage.setItem(STORAGE_KEY, result.token);
    setToken(result.token);
    setAdmin(result.data.admin);
    setBooting(false);
    return result;
  }, []);

  const loadNotifications = useCallback(
    async (activeToken = token) => {
      if (!activeToken) return;
      try {
        const result = await api.notifications(activeToken);
        setNotifications(result.data || []);
        setUnread(result.meta?.unread || 0);
      } catch (error) {
        if (error.status === 401 || error.status === 403) logout();
      }
    },
    [token, logout]
  );

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return undefined;
    }
    let cancelled = false;
    setBooting(true);
    api
      .me(token)
      .then((result) => {
        if (!cancelled) setAdmin(result.data.admin);
      })
      .catch((error) => {
        if (error.status === 401 || error.status === 403) logout();
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    const socket = io(API_ORIGIN, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const onNotification = (item) => {
      setNotifications((list) => {
        if (list.some((existing) => existing.id === item.id)) return list;
        return [item, ...list].slice(0, 50);
      });
      setUnread((count) => count + 1);
      setLiveTick((tick) => tick + 1);
      pushToast({
        title: item.title,
        message: item.message,
        tone:
          item.type === 'registration_rejected'
            ? 'danger'
            : item.type === 'registration_submitted'
              ? 'warn'
              : 'ok',
      });
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        try {
          new Notification(item.title, {
            body: item.message,
            icon: '/icons/pwa-192.png',
            tag: item.id,
          });
        } catch {
          // Some browsers block constructor use outside a service worker.
        }
      }
    };

    socket.on('admin:notification', onNotification);
    socket.on('connect', () => {
      if (!active) return;
      setConnected(true);
      setLiveTick((tick) => tick + 1);
      loadNotifications(token);
    });
    socket.on('disconnect', () => setConnected(false));
    loadNotifications(token);

    return () => {
      active = false;
      setConnected(false);
      socket.off('admin:notification', onNotification);
      socket.close();
      socketRef.current = null;
    };
  }, [token, loadNotifications, pushToast]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.setAppBadge) return;
    if (unread > 0) {
      navigator.setAppBadge(unread).catch(() => {});
    } else if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unread]);

  const refreshPendingApprovals = useCallback(
    async (activeToken = token) => {
      if (!activeToken) return;
      try {
        const result = await api.registrations(activeToken, 'pending');
        setPendingApprovals(result.meta?.counts?.pending ?? result.data.length);
      } catch {
        // The queue itself will surface any auth or network problem.
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    refreshPendingApprovals(token);
  }, [token, liveTick, refreshPendingApprovals]);

  const syncControlRoom = useCallback(
    (activeToken = token) => {
      if (!activeToken) return;
      loadNotifications(activeToken);
      setLiveTick((tick) => tick + 1);
    },
    [token, loadNotifications]
  );

  // Socket.io can drop on mobile networks, free-tier sleep or blocked WebSockets.
  // Poll and refresh on resume so registrations never stay invisible in the queue.
  useEffect(() => {
    if (!token) return undefined;

    const timer = window.setInterval(() => syncControlRoom(token), 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncControlRoom(token);
    };

    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, syncControlRoom]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await api.markAllNotificationsRead(token);
      setUnread(0);
      setNotifications((list) => list.map((item) => ({ ...item, read: true })));
    } catch (error) {
      pushToast({ title: 'Could not update alerts', message: error.message, tone: 'danger' });
    }
  }, [token, pushToast]);

  const markRead = useCallback(
    async (id) => {
      if (!token) return;
      try {
        const result = await api.markNotificationRead(token, id);
        setUnread(result.meta?.unread ?? 0);
        setNotifications((list) =>
          list.map((item) => (item.id === id ? { ...item, read: true } : item))
        );
      } catch (error) {
        pushToast({ title: 'Could not update alert', message: error.message, tone: 'danger' });
      }
    },
    [token, pushToast]
  );

  const enableBrowserAlerts = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      pushToast({
        title: 'Alerts unavailable',
        message: 'This browser does not support desktop notifications.',
        tone: 'danger',
      });
      return 'unsupported';
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    pushToast(
      permission === 'granted'
        ? { title: 'Browser alerts enabled', message: 'New registrations will pop up on this device.', tone: 'ok' }
        : { title: 'Alerts not enabled', message: 'Allow notifications from site settings to enable them.', tone: 'warn' }
    );
    return permission;
  }, [pushToast]);

  const value = useMemo(
    () => ({
      token,
      admin,
      booting,
      login,
      logout,
      notifications,
      unread,
      liveTick,
      pendingApprovals,
      connected,
      toasts,
      pushToast,
      dismissToast,
      markAllRead,
      markRead,
      refreshPendingApprovals,
      enableBrowserAlerts,
      notificationPermission,
      loadNotifications,
    }),
    [
      token,
      admin,
      booting,
      login,
      logout,
      notifications,
      unread,
      liveTick,
      pendingApprovals,
      connected,
      toasts,
      pushToast,
      dismissToast,
      markAllRead,
      markRead,
      refreshPendingApprovals,
      enableBrowserAlerts,
      notificationPermission,
      loadNotifications,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used inside AdminProvider');
  return context;
}
