const backend = require('./prospectsBackend');

const PLAN_IDS = ['starter', 'growth', 'premium', 'setup'];

const DEFAULTS = {
  brandName: 'PulseLocal AI',
  founderName: '',
  contactEmail: '',
  whatsapp: '',
  calendlyUrl: '',
  videoUrl: '',
  setupDays: 2,
  plans: {
    starter: { price: 49, link: '', enabled: true },
    growth: { price: 79, link: '', enabled: true },
    premium: { price: 99, link: '', enabled: true },
    setup: { price: 299, monthly: 39, link: '', enabled: true }
  }
};

let cache = null;

function merge(saved) {
  const base = JSON.parse(JSON.stringify(DEFAULTS));
  if (!saved) return base;
  const out = { ...base, ...saved, plans: { ...base.plans } };
  PLAN_IDS.forEach((id) => {
    out.plans[id] = { ...base.plans[id], ...(saved.plans?.[id] || {}) };
  });
  return out;
}

async function getOffer() {
  if (!cache) cache = merge(await backend.getSettings());
  return cache;
}

function str(v) {
  return typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v).trim();
}

function httpsUrl(v) {
  const s = str(v);
  if (!s) return { ok: true, value: '' };
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' || !u.hostname.includes('.')) return { ok: false };
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false };
  }
}

function validateOffer(input = {}) {
  const errors = {};
  const value = {};

  const brandName = str(input.brandName);
  if (brandName.length < 2 || brandName.length > 40) errors.brandName = 'Brand name must be 2–40 characters';
  value.brandName = brandName;

  const founderName = str(input.founderName);
  if (founderName && (founderName.length > 40 || !/^[\p{L}][\p{L} .'-]*$/u.test(founderName))) {
    errors.founderName = 'Use letters only (40 max)';
  }
  value.founderName = founderName;

  const email = str(input.contactEmail).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.contactEmail = 'Enter a valid email';
  value.contactEmail = email;

  const wa = str(input.whatsapp).replace(/[^\d+]/g, '');
  const waDigits = wa.replace(/\D/g, '');
  if (wa && (waDigits.length < 10 || waDigits.length > 15)) errors.whatsapp = 'Include country code, e.g. +91 98765 43210';
  value.whatsapp = waDigits;

  const cal = httpsUrl(input.calendlyUrl);
  if (!cal.ok) errors.calendlyUrl = 'Use a full https:// link';
  value.calendlyUrl = cal.value;

  const video = httpsUrl(input.videoUrl);
  if (!video.ok) errors.videoUrl = 'Use a full https:// Loom or YouTube link';
  value.videoUrl = video.value;

  const days = Number(input.setupDays);
  if (!Number.isInteger(days) || days < 1 || days > 14) errors.setupDays = 'Setup time must be 1–14 days';
  value.setupDays = days;

  value.plans = {};
  PLAN_IDS.forEach((id) => {
    const p = input.plans?.[id] || {};
    const price = Number(p.price);
    if (!Number.isFinite(price) || price < 1 || price > 5000) errors[`${id}.price`] = 'Price must be 1–5000';
    const link = httpsUrl(p.link);
    if (!link.ok) errors[`${id}.link`] = 'Payment link must start with https://';
    const plan = { price: Math.round(price), link: link.value, enabled: p.enabled !== false };
    if (id === 'setup') {
      const monthly = Number(p.monthly);
      if (!Number.isFinite(monthly) || monthly < 0 || monthly > 1000) errors['setup.monthly'] = 'Monthly must be 0–1000';
      plan.monthly = Math.round(monthly);
    }
    value.plans[id] = plan;
  });
  if (!PLAN_IDS.some((id) => value.plans[id].enabled)) errors['growth.price'] = 'Keep at least one plan switched on';

  return { ok: Object.keys(errors).length === 0, errors, value };
}

async function saveOffer(value) {
  await backend.saveSettings(value);
  cache = merge(value);
  return cache;
}

function videoEmbed(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const loom = u.hostname.endsWith('loom.com') && u.pathname.match(/\/(share|embed)\/([a-zA-Z0-9]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[2]}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || (u.pathname.match(/\/(embed|shorts)\/([\w-]+)/) || [])[2];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {
    return '';
  }
  return '';
}

async function publicOffer() {
  const o = await getOffer();
  const plans = {};
  PLAN_IDS.forEach((id) => {
    const p = o.plans[id];
    if (!p.enabled) return;
    plans[id] = { price: p.price, ...(id === 'setup' ? { monthly: p.monthly } : {}), hasLink: Boolean(p.link) };
  });
  return {
    brandName: o.brandName,
    founderName: o.founderName,
    contactEmail: o.contactEmail,
    whatsapp: o.whatsapp,
    calendlyUrl: o.calendlyUrl,
    videoUrl: o.videoUrl,
    videoEmbed: videoEmbed(o.videoUrl),
    setupDays: o.setupDays,
    plans
  };
}

async function checkoutLink(planId) {
  const o = await getOffer();
  const p = o.plans[planId];
  return p && p.enabled && p.link ? p.link : '';
}

module.exports = { getOffer, validateOffer, saveOffer, publicOffer, checkoutLink, PLAN_IDS };
