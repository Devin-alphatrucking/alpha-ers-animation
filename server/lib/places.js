const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.addressComponents',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.businessStatus',
  'places.primaryTypeDisplayName',
  'nextPageToken'
].join(',');

const NICHE_QUERY = {
  medspa: 'med spa',
  dental: 'dentist',
  detailing: 'auto detailing',
  homeservices: 'HVAC contractor'
};

const COUNTRY_CURRENCY = {
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  FI: 'EUR'
};

const COUNTRY_NAME_CODE = {
  usa: 'US',
  us: 'US',
  'united states': 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  australia: 'AU',
  canada: 'CA',
  ireland: 'IE',
  germany: 'DE',
  france: 'FR',
  netherlands: 'NL',
  spain: 'ES',
  italy: 'IT'
};

const cache = new Map();
const CACHE_MS = 24 * 60 * 60 * 1000;

function apiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || '';
}

function isLive() {
  return Boolean(apiKey());
}

function score(lead) {
  let points = 0;
  const reasons = [];
  if (!lead.website) {
    points += 35;
    reasons.push('No website');
  }
  if (lead.rating === null) {
    points += 20;
    reasons.push('No Google rating yet');
  } else if (lead.rating < 4.0) {
    points += 25;
    reasons.push(`Rating ${lead.rating.toFixed(1)}`);
  } else if (lead.rating < 4.5) {
    points += 15;
    reasons.push(`Rating ${lead.rating.toFixed(1)} could be higher`);
  }
  if (lead.rating === null) {
    // no reviews at all is already covered above
  } else if (lead.reviewCount < 30) {
    points += 25;
    reasons.push(`Only ${lead.reviewCount} reviews`);
  } else if (lead.reviewCount < 100) {
    points += 12;
    reasons.push(`${lead.reviewCount} reviews`);
  }
  if (lead.phone) points += 5;
  if (lead.rating >= 4.7 && lead.reviewCount >= 300) points -= 15;
  const value = Math.max(0, Math.min(100, points));
  return { score: value, tier: value >= 60 ? 'hot' : value >= 35 ? 'good' : 'low', reasons };
}

function cleanCity(s) {
  const v = String(s || '').trim();
  return /^[\p{L}][\p{L} .'-]{1,39}$/u.test(v) ? v : '';
}

function normalize(place, fallback) {
  const comp = (type) => (place.addressComponents || []).find((c) => (c.types || []).includes(type));
  const countryComp = comp('country');
  const countryCode = countryComp?.shortText || fallback.countryCode || '';
  const city = cleanCity(comp('locality')?.longText || comp('postal_town')?.longText) || fallback.city;
  const lead = {
    placeId: place.id,
    businessName: String(place.displayName?.text || '').slice(0, 60),
    address: place.formattedAddress || '',
    city,
    country: countryComp?.longText || fallback.country || '',
    countryCode,
    currencyCode: COUNTRY_CURRENCY[countryCode] || 'USD',
    rating: typeof place.rating === 'number' ? Math.round(place.rating * 10) / 10 : null,
    reviewCount: place.userRatingCount || 0,
    website: place.websiteUri || '',
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
    mapsUrl: place.googleMapsUri || '',
    category: place.primaryTypeDisplayName?.text || '',
    open: place.businessStatus !== 'CLOSED_PERMANENTLY' && place.businessStatus !== 'CLOSED_TEMPORARILY'
  };
  return { ...lead, ...score(lead) };
}

async function searchLive({ query, fallback, pageToken }) {
  const res = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify({ textQuery: query, pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
    signal: AbortSignal.timeout(12000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Google Places returned ${res.status}`);
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  return {
    leads: (data.places || []).map((p) => normalize(p, fallback)).filter((l) => l.businessName && l.open),
    nextPageToken: data.nextPageToken || ''
  };
}

const SAMPLE_WORDS = {
  medspa: { a: ['Glow', 'Radiance', 'Luxe', 'Pure', 'Velvet', 'Bloom', 'Aura', 'Serene', 'Halo', 'Lumi'], b: ['Med Spa', 'Aesthetics', 'Skin Studio', 'Wellness Spa', 'Laser Clinic'] },
  dental: { a: ['Bright', 'Family', 'Gentle', 'Smile', 'Park', 'Oak', 'Harbor', 'Summit', 'Main Street', 'Riverside'], b: ['Dental', 'Dentistry', 'Dental Care', 'Smiles', 'Dental Studio'] },
  detailing: { a: ['Shine', 'Mirror', 'Elite', 'Prestige', 'Gloss', 'Apex', 'Diamond', 'Torque', 'Pristine', 'Precision'], b: ['Auto Detailing', 'Detail Co', 'Mobile Detailing', 'Ceramic Pros', 'Car Care'] },
  homeservices: { a: ['Cool Breeze', 'Reliable', 'Comfort', 'Allstar', 'Summit', 'Patriot', 'Blue Sky', 'Precision', 'Hometown', 'Ironclad'], b: ['HVAC', 'Heating & Air', 'Roofing', 'Air Services', 'Comfort Systems'] }
};

function seeded(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function samplePhone(countryCode, rand) {
  const n = () => Math.floor(rand() * 10);
  if (countryCode === 'GB') return `+44 20 7946 0${n()}${n()}${n()}`;
  if (countryCode === 'AU') return `+61 2 5550 ${n()}${n()}${n()}${n()}`;
  return `+1 512-555-01${n()}${n()}`;
}

function searchSample({ nicheId, fallback, pageToken }) {
  const page = Number(String(pageToken || '').replace('sample:', '')) || 1;
  const rand = seeded(`${nicheId}|${fallback.city.toLowerCase()}|${page}`);
  const words = SAMPLE_WORDS[nicheId] || SAMPLE_WORDS.medspa;
  const used = new Set();
  const leads = [];
  while (leads.length < 20) {
    const name = `${words.a[Math.floor(rand() * words.a.length)]} ${words.b[Math.floor(rand() * words.b.length)]}`;
    const full = rand() > 0.6 ? `${name} ${fallback.city}` : name;
    if (used.has(full)) {
      if (used.size > 45) break;
      continue;
    }
    used.add(full);
    const slug = full.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const noRating = rand() < 0.06;
    const rating = noRating ? null : Math.round((3.3 + rand() * 1.7) * 10) / 10;
    const reviewCount = noRating ? 0 : Math.floor(Math.pow(rand(), 2) * 480) + 2;
    const hasSite = rand() > 0.32;
    const lead = {
      placeId: `sample_${slug}_${page}`,
      businessName: full.slice(0, 60),
      address: `${100 + Math.floor(rand() * 8800)} ${['Main St', 'Oak Ave', 'Market St', 'Park Rd', 'High St'][Math.floor(rand() * 5)]}, ${fallback.city}`,
      city: fallback.city,
      country: fallback.country,
      countryCode: fallback.countryCode,
      currencyCode: COUNTRY_CURRENCY[fallback.countryCode] || 'USD',
      rating,
      reviewCount,
      website: hasSite ? `https://www.${slug}.example` : '',
      phone: samplePhone(fallback.countryCode, rand),
      mapsUrl: '',
      category: NICHE_QUERY[nicheId] || '',
      open: true,
      sample: true
    };
    leads.push({ ...lead, ...score(lead) });
  }
  return { leads, nextPageToken: page < 3 ? `sample:${page + 1}` : '' };
}

function validateSearch(body = {}) {
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  const errors = {};
  const nicheId = NICHE_QUERY[body.nicheId] ? body.nicheId : '';
  const city = s(body.city);
  const country = s(body.country);
  const keyword = s(body.keyword);
  const pageToken = s(body.pageToken).slice(0, 600);
  if (!nicheId) errors.nicheId = 'Pick an industry';
  if (!cleanCity(city)) errors.city = 'Enter a city (letters only)';
  if (country && !/^[\p{L}][\p{L} .'-]{1,39}$/u.test(country)) errors.country = 'Country should be letters only';
  if (keyword.length > 40 || /[<>{}]/.test(keyword)) errors.keyword = 'Keep the keyword short (40 max)';
  return { ok: Object.keys(errors).length === 0, errors, value: { nicheId, city, country, keyword, pageToken } };
}

async function search({ nicheId, city, country, keyword, pageToken }) {
  const countryCode = COUNTRY_NAME_CODE[country.toLowerCase()] || (country ? '' : 'US');
  const fallback = { city, country: country || 'United States', countryCode };
  const query = `${keyword || NICHE_QUERY[nicheId]} in ${city}${country ? `, ${country}` : ''}`;
  const key = `${isLive() ? 'live' : 'sample'}|${query.toLowerCase()}|${pageToken}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ...hit.result, cached: true };

  const result = isLive() ? await searchLive({ query, fallback, pageToken }) : searchSample({ nicheId, fallback, pageToken });
  const out = { query, live: isLive(), ...result };
  cache.set(key, { at: Date.now(), result: out });
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  return out;
}

module.exports = { search, validateSearch, isLive, score, cleanCity, COUNTRY_CURRENCY };
