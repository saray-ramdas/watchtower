const API_BASE = 'http://localhost:8888';
const TOKEN_KEY = 'watchtower.token';
const USER_KEY = 'watchtower.user';

export const auth = {
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function request(path, { method = 'GET', body, authed = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authed) {
    const token = auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message[0]?.msg || 'Request failed' : message);
  }
  return data;
}

export const api = {
  setupStatus: () => request('/api/setup/status'),
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  exchangeClerkToken: (sessionToken) => request('/api/auth/clerk/exchange', {
    method: 'POST',
    body: { session_token: sessionToken },
  }),
  me: () => request('/api/auth/me', { authed: true }),
  listProjects: () => request('/api/projects', { authed: true }),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: payload, authed: true }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE', authed: true }),
  getProject: (id) => request(`/api/projects/${id}`, { authed: true }),
  updateProject: (id, payload) => request(`/api/projects/${id}`, { method: 'PATCH', body: payload, authed: true }),
  listEndpoints: (projectId) => request(`/api/projects/${projectId}/endpoints`, { authed: true }),
  createEndpoint: (projectId, payload) => request(`/api/projects/${projectId}/endpoints`, { method: 'POST', body: payload, authed: true }),
  updateEndpoint: (projectId, endpointId, payload) =>
    request(`/api/projects/${projectId}/endpoints/${endpointId}`, { method: 'PATCH', body: payload, authed: true }),
  updateProviderKey: (projectId, endpointId, providerId, key) =>
    request(`/api/projects/${projectId}/endpoints/${endpointId}/providers/${providerId}`, {
      method: 'PUT', body: { key }, authed: true,
    }),
  listUsers: () => request('/api/users', { authed: true }),
  maskText: (text, endpointId) => request('/api/test/mask', {
    method: 'POST',
    body: { text, endpoint_id: endpointId ?? null },
    authed: true,
  }),
  getProjectStats: (projectId) => request(`/api/projects/${projectId}/stats`, { authed: true }),
  listProjectEvents: (projectId, { suspiciousOnly = false, limit = 200, from = null, to = null } = {}) => {
    const params = new URLSearchParams({
      suspicious_only: String(suspiciousOnly),
      limit: String(limit),
    });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/api/projects/${projectId}/events?${params.toString()}`, { authed: true });
  },
  finalizeEvent: (eventId, finalOutput) =>
    request(`/api/test/events/${eventId}/finalize`, {
      method: 'POST',
      body: { final_output: finalOutput },
      authed: true,
    }),
};
