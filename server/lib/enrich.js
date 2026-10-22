const dns = require('dns').promises;
const net = require('net');

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 6000;
const IG_RESERVED = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'about', 'developer', 'legal', 'direct', 'sharer', 'share']);
const EMAIL_JUNK = /(\.png|\.jpe?g|\.gif|\.svg|\.webp)$|@(example\.|sentry|wixpress|domain\.com|email\.com|yourdomain|godaddy)/i;

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

async function safeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
  if (u.port && !['80', '443'].includes(u.port)) return null;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host)) return privateIp(host) ? null : u;
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal')) return null;
  try {
    const addrs = await dns.lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
  } catch {
    return null;
  }
  return u;
}

async function fetchHtml(raw) {
  let url = raw;
  for (let hop = 0; hop < 4; hop += 1) {
    const u = await safeUrl(url);
    if (!u) return '';
    const res = await fetch(u, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulseLocalBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), u).toString();
      continue;
    }
    if (!res.ok || !(res.headers.get('content-type') || '').includes('html') || !res.body) return '';
    const reader = res.body.getReader();
    const chunks = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return Buffer.concat(chunks).toString('utf8');
  }
  return '';
}

function extract(html, siteHost) {
  const decoded = html.replace(/&#64;|&commat;/gi, '@').replace(/%40/g, '@');
  const emails = new Set();
  for (const m of decoded.matchAll(/mailto:([^"'?\s>]+)/gi)) emails.add(m[1].toLowerCase());
  for (const m of decoded.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) emails.add(m[0].toLowerCase());
  const clean = [...emails].filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 80 && !EMAIL_JUNK.test(e));
  const root = siteHost.replace(/^www\./, '');
  clean.sort((a, b) => Number(b.endsWith(`@${root}`)) - Number(a.endsWith(`@${root}`)));

  let instagram = '';
  for (const m of decoded.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/gi)) {
    const handle = m[1].replace(/\.+$/, '').toLowerCase();
    if (!IG_RESERVED.has(handle) && handle.length >= 2) {
      instagram = handle;
      break;
    }
  }
  return { email: clean[0] || '', instagram };
}

async function enrichWebsite(website) {
  try {
    const base = new URL(website);
    let found = extract(await fetchHtml(base.toString()), base.hostname);
    if (!found.email) {
      for (const path of ['/contact', '/contact-us']) {
        const more = extract(await fetchHtml(new URL(path, base).toString()), base.hostname);
        found = { email: more.email, instagram: found.instagram || more.instagram };
        if (found.email) break;
      }
    }
    return found;
  } catch {
    return { email: '', instagram: '' };
  }
}

function sampleEnrich(lead) {
  const slug = lead.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const n = slug.length;
  return {
    email: lead.website && n % 3 !== 0 ? `hello@${slug}.example` : '',
    instagram: n % 2 === 0 ? slug.slice(0, 24) : ''
  };
}

async function enrichMany(leads, concurrency = 4) {
  const out = new Array(leads.length);
  let next = 0;
  async function worker() {
    while (next < leads.length) {
      const i = next;
      next += 1;
      const lead = leads[i];
      if (lead.sample) out[i] = sampleEnrich(lead);
      else out[i] = lead.website ? await enrichWebsite(lead.website) : { email: '', instagram: '' };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, leads.length) }, worker));
  return out;
}

module.exports = { enrichMany, enrichWebsite, extract };
