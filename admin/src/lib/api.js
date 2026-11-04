const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const API_ORIGIN = RAW_BASE ? new URL(RAW_BASE, window.location.origin).origin : window.location.origin;

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || [];
  }
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${RAW_BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the Raahat API. Check your connection.', 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status, payload?.errors);
  }
  return payload;
}

export const api = {
  login: (email, password) => request('/admin/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/admin/me', { token }),
  overview: (token) => request('/admin/overview', { token }),
  registrations: (token, status = 'pending') =>
    request(`/admin/registrations?status=${encodeURIComponent(status)}`, { token }),
  review: (token, hospitalId, decision, note = '') =>
    request(`/admin/registrations/${hospitalId}/review`, {
      method: 'POST',
      token,
      body: { decision, note },
    }),
  hospitals: (token, { q = '', status = 'all' } = {}) => {
    const params = new URLSearchParams({ status });
    if (q) params.set('q', q);
    return request(`/admin/hospitals?${params.toString()}`, { token });
  },
  verifyContacts: (token, hospitalId) =>
    request(`/admin/hospitals/${hospitalId}/verify-contacts`, { method: 'POST', token }),
  notifications: (token, limit = 30) => request(`/admin/notifications?limit=${limit}`, { token }),
  markNotificationRead: (token, id) =>
    request(`/admin/notifications/${id}/read`, { method: 'POST', token }),
  markAllNotificationsRead: (token) =>
    request('/admin/notifications/read-all', { method: 'POST', token }),
};

export async function fetchRegistrationDocument(token, hospitalId) {
  let response;
  try {
    response = await fetch(`${RAW_BASE}/api/admin/registrations/${hospitalId}/document`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError('Cannot reach the Raahat API. Check your connection.', 0);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.message || `Document download failed (${response.status})`, response.status);
  }
  return response.blob();
}
