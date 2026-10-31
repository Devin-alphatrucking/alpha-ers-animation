export const STAGES = [
  { id: 'new', label: 'New', hint: 'Researched, not contacted', dot: 'bg-mute/50' },
  { id: 'contacted', label: 'Contacted', hint: 'DM or email sent', dot: 'bg-gold' },
  { id: 'replied', label: 'Replied', hint: 'They wrote back', dot: 'bg-pineBright' },
  { id: 'demo', label: 'Demo booked', hint: 'Call or Loom scheduled', dot: 'bg-ember' },
  { id: 'won', label: 'Won', hint: 'Paying customer', dot: 'bg-moss' },
  { id: 'lost', label: 'Lost', hint: 'Not now', dot: 'bg-ink/40' }
];

export const stageLabel = (id) => STAGES.find((s) => s.id === id)?.label || id;

export const OPEN_STAGES = ['new', 'contacted', 'replied', 'demo'];

export const nicheShort = {
  medspa: 'MedSpa',
  dental: 'Dental',
  detailing: 'Detailing',
  homeservices: 'HVAC / Roofing'
};

export const COUNTRY_CURRENCY = {
  usa: 'USD',
  'united states': 'USD',
  us: 'USD',
  'united kingdom': 'GBP',
  uk: 'GBP',
  england: 'GBP',
  scotland: 'GBP',
  australia: 'AUD',
  canada: 'CAD',
  ireland: 'EUR',
  germany: 'EUR',
  france: 'EUR',
  netherlands: 'EUR',
  spain: 'EUR',
  italy: 'EUR'
};

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function followUpState(p) {
  if (!p.nextFollowUp || !OPEN_STAGES.includes(p.stage)) return null;
  const at = new Date(p.nextFollowUp);
  if (at < startOfToday()) return 'overdue';
  if (at <= endOfToday()) return 'today';
  return 'later';
}

export function isDue(p) {
  const s = followUpState(p);
  return s === 'overdue' || s === 'today';
}

export function followUpLabel(p) {
  const s = followUpState(p);
  if (!s) return '';
  const at = new Date(p.nextFollowUp);
  if (s === 'today') return 'Follow up today';
  const days = Math.round((startOfDay(at) - startOfToday()) / 86400000);
  if (s === 'overdue') return `Overdue ${Math.abs(days)}d`;
  if (days === 1) return 'Follow up tomorrow';
  return `Follow up ${at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const HOT_HOURS = 48;

export function isHot(p) {
  if (!p.lastViewedAt || !OPEN_STAGES.includes(p.stage)) return false;
  return Date.now() - new Date(p.lastViewedAt).getTime() < HOT_HOURS * 3600000;
}

export function isBuying(p) {
  if (!p.buyingSignalAt || !OPEN_STAGES.includes(p.stage)) return false;
  return Date.now() - new Date(p.buyingSignalAt).getTime() < 7 * 24 * 3600000;
}

export function viewedAgo(p) {
  if (!p.lastViewedAt) return '';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(p.lastViewedAt).getTime()) / 60000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function trackedLink(p) {
  const params = new URLSearchParams({
    biz: p.businessName,
    niche: p.nicheId,
    city: p.city,
    currency: p.currencyCode || 'USD'
  });
  if (p.rating && p.rating >= 3) params.set('rating', String(p.rating));
  if (p.ownerName) params.set('owner', p.ownerName.split(' ')[0]);
  if (p.trackId) params.set('ref', p.trackId);
  return `${window.location.origin}/?${params.toString()}`;
}

export function toDateInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInput(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 10, 0, 0, 0).toISOString();
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export const SAMPLE_CSV = `business,owner,niche,city,country,email,instagram,rating
Bay Smile Dental,Anna,dental,Brighton,United Kingdom,anna@baysmile.example,,4.4
Velvet Skin Clinic,Mia,medspa,Sydney,Australia,,velvetskin.syd,4.7
Torque Detailing,Chris,auto detailing,Vancouver,Canada,chris@torque.example,torquedetail,4.6`;
