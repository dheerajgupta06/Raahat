export const PUBLIC_SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL ||
  (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:5173` : '');

export const STAFF_SITE_URL =
  import.meta.env.VITE_STAFF_SITE_URL ||
  (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:5173/login` : '');
