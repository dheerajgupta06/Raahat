const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || [];
  }
}

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_ORIGIN}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    signal,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || `Request failed (${response.status})`,
      response.status,
      payload?.errors
    );
  }
  return payload;
}

function query(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  return search.toString();
}

export const api = {
  origin: API_ORIGIN,

  nearby(params, { signal } = {}) {
    return request(`/hospitals/nearby?${query(params)}`, { signal });
  },

  stats({ signal } = {}) {
    return request('/hospitals/stats', { signal });
  },

  hospital(id, coords, { signal } = {}) {
    return request(`/hospitals/${id}?${query(coords || {})}`, { signal });
  },

  contacts(id, { signal } = {}) {
    return request(`/hospitals/${id}/contacts`, { signal });
  },

  login(email, password) {
    return request('/auth/login', { method: 'POST', body: { email, password } });
  },

  register({ admin, hospital, document }) {
    const body = new FormData();
    body.append('admin', JSON.stringify(admin));
    body.append('hospital', JSON.stringify(hospital));
    if (document) body.append('document', document);
    return request('/auth/register', { method: 'POST', body });
  },

  async registrationDocument(token) {
    const response = await fetch(`${API_ORIGIN}/api/hospitals/me/registration`, {
      headers: { Accept: 'application/pdf,image/*', Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status);
    }
    return response.blob();
  },

  me(token) {
    return request('/hospitals/me', { token });
  },

  updateBeds(id, patch, token) {
    return request(`/hospitals/${id}/beds`, { method: 'PUT', body: patch, token });
  },

  updateOxygen(id, patch, token) {
    return request(`/hospitals/${id}/oxygen`, { method: 'PUT', body: patch, token });
  },

  updateContacts(id, patch, token) {
    return request(`/hospitals/${id}/contacts`, { method: 'PUT', body: patch, token });
  },

  verifyContacts(id, token) {
    return request(`/hospitals/${id}/contacts/verify`, { method: 'POST', token });
  },

  updateProfile(id, patch, token) {
    return request(`/hospitals/${id}/profile`, { method: 'PUT', body: patch, token });
  },
};

export const socketOrigin = API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
