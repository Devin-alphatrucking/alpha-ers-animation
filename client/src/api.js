const DEMO_KEY = 'pl_demo_id';
const TOKEN_KEY = 'pl_owner_token';

function demoId() {
  let id = window.localStorage.getItem(DEMO_KEY);
  if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
    id = (window.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).replace(/[^A-Za-z0-9_-]/g, '');
    window.localStorage.setItem(DEMO_KEY, id);
  }
  return id;
}

export const ownerToken = {
  get: () => window.localStorage.getItem(TOKEN_KEY) || '',
  set: (t) => (t ? window.localStorage.setItem(TOKEN_KEY, t) : window.localStorage.removeItem(TOKEN_KEY))
};

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = ownerToken.get();
  const { headers, ...rest } = options;
  let res;
  try {
    res = await fetch(path, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Id': demoId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {})
      }
    });
  } catch {
    const err = new Error('Can’t reach the server. Check your connection and try again.');
    err.status = 0;
    throw err;
  }
  if (res.status === 401 && token && path !== '/api/auth/login') {
    ownerToken.set('');
    onUnauthorized?.();
  }
  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    const first = data?.errors ? Object.values(data.errors)[0] : '';
    const err = new Error(data?.message || first || `Request failed (${res.status})`);
    err.status = res.status;
    err.errors = data?.errors || null;
    throw err;
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  me: () => request('/api/auth/me'),
  offer: () => request('/api/offer'),
  leadsStatus: () => request('/api/leads/status'),
  searchLeads: (payload) => request('/api/leads/search', { method: 'POST', body: JSON.stringify(payload) }),
  importLeads: (payload) => request('/api/leads/import', { method: 'POST', body: JSON.stringify(payload) }),
  settings: () => request('/api/settings'),
  saveSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  onboarding: (payload) => request('/api/onboarding', { method: 'POST', body: JSON.stringify(payload) }),
  login: (password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  niches: () => request('/api/niches'),
  state: () => request('/api/state'),
  reset: (nicheId) =>
    request('/api/reset', { method: 'POST', body: JSON.stringify({ nicheId }) }),
  personalize: (payload) =>
    request('/api/personalize', { method: 'POST', body: JSON.stringify(payload) }),
  leadReply: (id, text) =>
    request(`/api/leads/${id}/reply`, { method: 'POST', body: JSON.stringify({ text, from: 'staff' }) }),
  leadAi: (id, text) =>
    request(`/api/leads/${id}/ai-reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  missedCall: (customer) =>
    request('/api/simulate/missed-call', { method: 'POST', body: JSON.stringify({ customer }) }),
  instagram: (customer) =>
    request('/api/simulate/instagram', { method: 'POST', body: JSON.stringify({ customer }) }),
  chat: (text, channel) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ text, channel }) }),
  createBooking: (payload) =>
    request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  patchBooking: (id, status) =>
    request(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  completeAndReview: (id) =>
    request(`/api/bookings/${id}/complete-and-review`, { method: 'POST' }),
  requestReview: (customer) =>
    request('/api/reviews/request', { method: 'POST', body: JSON.stringify({ customer }) }),
  submitReview: (payload) =>
    request('/api/reviews/submit', { method: 'POST', body: JSON.stringify(payload) }),
  resolveFlag: (id) =>
    request('/api/reviews/resolve', { method: 'POST', body: JSON.stringify({ id }) }),
  outreach: (origin, prospectId) =>
    request(`/api/outreach?origin=${encodeURIComponent(origin)}${prospectId ? `&prospect=${encodeURIComponent(prospectId)}` : ''}`),
  prospects: () => request('/api/prospects'),
  createProspect: (payload) => request('/api/prospects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProspect: (id, payload) =>
    request(`/api/prospects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteProspect: (id) => request(`/api/prospects/${id}`, { method: 'DELETE' }),
  prospectActivity: (id, payload) =>
    request(`/api/prospects/${id}/activity`, { method: 'POST', body: JSON.stringify(payload) }),
  importProspects: (csv, dryRun) =>
    request('/api/prospects/import', { method: 'POST', body: JSON.stringify({ csv, dryRun }) })
};

export function formatMoney(amount, symbol = '$') {
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString('en-US')}`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatWhen(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
