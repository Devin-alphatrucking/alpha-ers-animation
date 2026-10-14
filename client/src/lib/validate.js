const LETTERS = /^[\p{L}][\p{L} .'-]*$/u;
const trim = (v) => String(v ?? '').trim();

export function businessName(v) {
  const s = trim(v);
  if (s.length < 2) return 'Business name needs at least 2 characters';
  if (s.length > 60) return 'Keep the name under 60 characters';
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .,'&+-]*$/u.test(s)) return 'Use letters, numbers, and basic punctuation only';
  return '';
}

export function city(v) {
  const s = trim(v);
  if (s.length < 2) return 'Enter a city';
  if (s.length > 40) return 'City is too long';
  if (!LETTERS.test(s)) return 'City should be letters only';
  return '';
}

export function country(v) {
  const s = trim(v);
  if (!s) return '';
  if (s.length > 40) return 'Country is too long';
  return LETTERS.test(s) ? '' : 'Country should be letters only';
}

export function rating(v, { min = 3 } = {}) {
  if (v === '' || v === null || v === undefined) return 'Enter the Google rating';
  const n = Number(v);
  if (Number.isNaN(n)) return 'Rating must be a number';
  if (n < min || n > 5) return `Rating must be between ${min.toFixed(1)} and 5.0`;
  return '';
}

export function optionalRating(v) {
  if (v === '' || v === null || v === undefined) return '';
  return rating(v, { min: 1 });
}

export function personName(v) {
  const s = trim(v);
  if (s.length < 2) return 'Enter a full name';
  if (s.length > 50) return 'Name is too long';
  if (!LETTERS.test(s)) return 'Name should be letters only';
  return '';
}

export function optionalPersonName(v) {
  return trim(v) ? personName(v) : '';
}

export function phone(v) {
  const s = trim(v);
  if (!/^[+\d][\d\s().-]*$/.test(s)) return 'Enter a valid mobile number (10+ digits)';
  const digits = s.replace(/\D/g, '');
  if (digits.length < 10) return 'Enter a valid mobile number (10+ digits)';
  if (digits.length > 15) return 'That number looks too long';
  return '';
}

export function optionalPhone(v) {
  return trim(v) ? phone(v) : '';
}

export function message(v, { min = 1, max = 400, label = 'Message' } = {}) {
  const s = trim(v);
  if (s.length < min) return min <= 1 ? `Type a ${label.toLowerCase()} first` : `${label} needs at least ${min} characters`;
  if (s.length > max) return `Keep it under ${max} characters`;
  return '';
}

export function email(v) {
  const s = trim(v);
  if (!s) return 'Email is required';
  if (s.length > 80) return 'Email is too long';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'Enter a valid email address';
  return '';
}

export function optionalEmail(v) {
  return trim(v) ? email(v) : '';
}

export function instagramHandle(v) {
  const s = trim(v).replace(/^@/, '');
  if (!s) return 'Instagram handle is required';
  if (!/^[a-zA-Z0-9._]{2,30}$/.test(s)) return 'Use 2–30 letters, numbers, periods, or underscores';
  return '';
}

export function optionalInstagram(v) {
  return trim(v).replace(/^@/, '') ? instagramHandle(v) : '';
}

export function website(v) {
  const s = trim(v);
  if (!s) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.includes('.') ? '' : 'Enter a valid website';
  } catch {
    return 'Enter a valid website';
  }
}

export function dealValue(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 5000 ? '' : 'Monthly value must be 0–5000';
}

export function stars(v) {
  const n = Number(v);
  if (!n || n < 1 || n > 5) return 'Choose a star rating';
  return '';
}

export function prospect(f) {
  const errors = {
    businessName: businessName(f.businessName),
    nicheId: f.nicheId ? '' : 'Pick an industry',
    city: city(f.city),
    country: country(f.country),
    ownerName: optionalPersonName(f.ownerName),
    email: optionalEmail(f.email),
    instagram: optionalInstagram(f.instagram),
    phone: optionalPhone(f.phone),
    website: website(f.website),
    rating: optionalRating(f.rating),
    dealValue: dealValue(f.dealValue),
    notes: trim(f.notes).length > 1000 ? 'Notes are too long (1000 max)' : ''
  };
  if (!trim(f.email) && !trim(f.instagram).replace(/^@/, '')) {
    errors.email = errors.email || 'Add an email or an Instagram handle';
    errors.instagram = errors.instagram || 'Add an email or an Instagram handle';
  }
  return collect(errors);
}

export function collect(map) {
  const errors = {};
  Object.entries(map).forEach(([key, msg]) => {
    if (msg) errors[key] = msg;
  });
  return { ok: Object.keys(errors).length === 0, errors };
}
