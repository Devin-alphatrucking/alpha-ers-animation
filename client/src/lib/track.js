const REF_KEY = 'pl_ref';
const VISIT_KEY = 'pl_visit';
const PING_MS = 20000;

let ref = null;
let visitId = null;
let enabled = false;
let timer = null;

const PAGE_FOR_PATH = { '/': 'overview', '/inbox': 'inbox', '/bookings': 'bookings', '/reviews': 'reviews', '/pricing': 'pricing' };

function send(type, extra = {}) {
  if (!enabled) return;
  try {
    fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, visitId, type, ...extra })
    }).catch(() => {});
  } catch {
    // Tracking must never break the demo.
  }
}

function ping() {
  if (document.visibilityState === 'visible') send('ping');
}

export function startTracking({ owner, urlRef }) {
  if (owner) {
    enabled = false;
    return;
  }
  if (urlRef && /^[a-z0-9]{10}$/.test(urlRef)) {
    if (window.sessionStorage.getItem(REF_KEY) !== urlRef) window.sessionStorage.removeItem(VISIT_KEY);
    window.sessionStorage.setItem(REF_KEY, urlRef);
  }
  ref = window.sessionStorage.getItem(REF_KEY);
  if (!ref) return;

  visitId = window.sessionStorage.getItem(VISIT_KEY);
  const isNew = !visitId;
  if (isNew) {
    visitId = `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(VISIT_KEY, visitId);
  }
  enabled = true;
  send(isNew ? 'open' : 'page', { page: PAGE_FOR_PATH[window.location.pathname] });

  clearInterval(timer);
  timer = window.setInterval(ping, PING_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send('ping');
  });
}

export function trackPage(pathname) {
  const page = PAGE_FOR_PATH[pathname];
  if (page) send('page', { page });
}

export function trackAction(action) {
  send('action', { action });
}

export function checkoutUrl(plan) {
  const params = new URLSearchParams();
  const r = ref || window.sessionStorage.getItem(REF_KEY);
  const v = visitId || window.sessionStorage.getItem(VISIT_KEY);
  if (enabled && r && v) {
    params.set('ref', r);
    params.set('v', v);
  }
  const qs = params.toString();
  return `/api/checkout/${plan}${qs ? `?${qs}` : ''}`;
}

export function currentRef() {
  return window.sessionStorage.getItem(REF_KEY) || '';
}
