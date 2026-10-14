const { niches, currencies } = require('../data/nichePresets');

const STAGES = ['new', 'contacted', 'replied', 'demo', 'won', 'lost'];
const ACTIVITY_TYPES = ['note', 'dm', 'email', 'call', 'reply', 'demo', 'won', 'lost', 'branded'];

const str = (v) => (v === undefined || v === null ? '' : String(v)).trim();
const LETTERS = /^[\p{L}][\p{L} .'-]*$/u;

const rules = {
  businessName: (v) => {
    const s = str(v);
    if (s.length < 2) return 'Business name needs at least 2 characters';
    if (s.length > 60) return 'Business name is too long (60 max)';
    return '';
  },
  ownerName: (v) => {
    const s = str(v);
    if (!s) return '';
    if (s.length > 50) return 'Owner name is too long';
    return LETTERS.test(s) ? '' : 'Owner name should be letters only';
  },
  nicheId: (v) => (niches[v] ? '' : 'Pick a supported industry'),
  city: (v) => {
    const s = str(v);
    if (s.length < 2) return 'City is required';
    if (s.length > 40) return 'City is too long';
    return LETTERS.test(s) ? '' : 'City should be letters only';
  },
  country: (v) => {
    const s = str(v);
    if (!s) return '';
    if (s.length > 40) return 'Country is too long';
    return LETTERS.test(s) ? '' : 'Country should be letters only';
  },
  currencyCode: (v) => (currencies[v] ? '' : 'Unsupported currency'),
  email: (v) => {
    const s = str(v);
    if (!s) return '';
    if (s.length > 80) return 'Email is too long';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? '' : 'Enter a valid email address';
  },
  instagram: (v) => {
    const s = str(v).replace(/^@/, '');
    if (!s) return '';
    return /^[a-zA-Z0-9._]{2,30}$/.test(s) ? '' : 'Instagram handle: 2–30 letters, numbers, . or _';
  },
  phone: (v) => {
    const s = str(v);
    if (!s) return '';
    if (!/^[+\d][\d\s().-]*$/.test(s)) return 'Phone can only contain digits, spaces, + ( ) -';
    const digits = s.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15 ? '' : 'Phone needs 10–15 digits';
  },
  website: (v) => {
    const s = str(v);
    if (!s) return '';
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      return u.hostname.includes('.') ? '' : 'Enter a valid website';
    } catch {
      return 'Enter a valid website';
    }
  },
  rating: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? '' : 'Rating must be between 1.0 and 5.0';
  },
  dealValue: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 5000 ? '' : 'Monthly value must be 0–5000';
  },
  stage: (v) => (STAGES.includes(v) ? '' : 'Unknown pipeline stage'),
  nextFollowUp: (v) => {
    if (!v) return '';
    return Number.isNaN(new Date(v).getTime()) ? 'Invalid follow-up date' : '';
  },
  notes: (v) => (str(v).length > 1000 ? 'Notes are too long (1000 max)' : '')
};

function normalizeField(key, v) {
  switch (key) {
    case 'rating':
    case 'dealValue':
      return v === '' || v === null || v === undefined ? null : Math.round(Number(v) * 10) / 10;
    case 'instagram':
      return str(v).replace(/^@/, '').toLowerCase();
    case 'email':
      return str(v).toLowerCase();
    case 'website': {
      const s = str(v);
      if (!s) return '';
      return /^https?:\/\//i.test(s) ? s : `https://${s}`;
    }
    case 'nextFollowUp':
      return v ? new Date(v).toISOString() : null;
    default:
      return str(v);
  }
}

function validateProspect(input, { partial = false } = {}) {
  const data = { ...(input || {}) };
  if (!partial) {
    if (!data.stage) data.stage = 'new';
    if (!data.currencyCode) data.currencyCode = 'USD';
  }
  const keys = partial ? Object.keys(rules).filter((k) => k in data) : Object.keys(rules);
  const errors = {};
  keys.forEach((k) => {
    const msg = rules[k](data[k]);
    if (msg) errors[k] = msg;
  });

  if (!partial && !str(data.email) && !str(data.instagram)) {
    errors.email = errors.email || 'Add an email or an Instagram handle';
    errors.instagram = errors.instagram || 'Add an email or an Instagram handle';
  }

  const value = {};
  keys.forEach((k) => {
    value[k] = normalizeField(k, data[k]);
  });

  return { ok: Object.keys(errors).length === 0, errors, value };
}

function validateActivity(input) {
  const errors = {};
  const type = str(input?.type);
  const text = str(input?.text);
  if (!ACTIVITY_TYPES.includes(type)) errors.type = 'Unknown activity type';
  if (text.length > 300) errors.text = 'Keep the note under 300 characters';
  if (type === 'note' && text.length < 2) errors.text = 'Write a short note';
  if (input?.advanceTo && !STAGES.includes(input.advanceTo)) errors.advanceTo = 'Unknown stage';
  const days = input?.followUpDays;
  if (days !== undefined && days !== null && days !== '') {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 0 || n > 60) errors.followUpDays = 'Follow-up must be 0–60 days';
  }
  return { ok: Object.keys(errors).length === 0, errors, value: { type, text, advanceTo: input?.advanceTo || null, followUpDays: days } };
}

const nicheAliases = {
  medspa: 'medspa',
  'med spa': 'medspa',
  aesthetics: 'medspa',
  spa: 'medspa',
  dental: 'dental',
  dentist: 'dental',
  orthodontics: 'dental',
  detailing: 'detailing',
  'auto detailing': 'detailing',
  auto: 'detailing',
  'car detailing': 'detailing',
  ceramic: 'detailing',
  homeservices: 'homeservices',
  'home services': 'homeservices',
  hvac: 'homeservices',
  plumbing: 'homeservices',
  plumber: 'homeservices',
  roofing: 'homeservices',
  roofer: 'homeservices'
};

const headerAliases = {
  businessName: ['business', 'businessname', 'business name', 'company', 'name', 'shop'],
  ownerName: ['owner', 'ownername', 'owner name', 'contact', 'first name', 'firstname'],
  nicheId: ['niche', 'industry', 'category', 'type'],
  city: ['city', 'town'],
  country: ['country'],
  currencyCode: ['currency'],
  email: ['email', 'e-mail', 'mail'],
  instagram: ['instagram', 'ig', 'insta', 'handle'],
  phone: ['phone', 'mobile', 'tel', 'telephone'],
  website: ['website', 'site', 'url', 'web'],
  rating: ['rating', 'google rating', 'stars'],
  notes: ['notes', 'note', 'comments']
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function rowsFromCsv(text) {
  const rows = parseCsv(String(text || ''));
  if (rows.length < 2) return { error: 'CSV needs a header row and at least one prospect', items: [] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const map = {};
  Object.entries(headerAliases).forEach(([key, aliases]) => {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[key] = idx;
  });
  if (map.businessName === undefined) return { error: 'CSV must include a "business" column', items: [] };
  if (map.city === undefined) return { error: 'CSV must include a "city" column', items: [] };

  const items = rows.slice(1).map((cells, i) => {
    const obj = {};
    Object.entries(map).forEach(([key, idx]) => {
      obj[key] = (cells[idx] || '').trim();
    });
    const niche = (obj.nicheId || '').toLowerCase();
    obj.nicheId = nicheAliases[niche] || (niches[niche] ? niche : niche ? niche : 'medspa');
    obj.currencyCode = (obj.currencyCode || 'USD').toUpperCase();
    return { line: i + 2, data: obj };
  });
  return { error: '', items };
}

module.exports = { STAGES, ACTIVITY_TYPES, validateProspect, validateActivity, rowsFromCsv };
