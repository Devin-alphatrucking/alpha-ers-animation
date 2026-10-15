const crypto = require('crypto');

const PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const PRODUCTION = process.env.NODE_ENV === 'production';
const TOKEN_DAYS = 30;
const enabled = Boolean(PASSWORD);

const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

if (!enabled) {
  console.warn(
    PRODUCTION
      ? '[auth] ADMIN_PASSWORD is not set — owner pages are locked until you set it.'
      : '[auth] ADMIN_PASSWORD is not set — owner pages are open (local dev only).'
  );
}
if (enabled && !process.env.AUTH_SECRET) {
  console.warn('[auth] AUTH_SECRET is not set — owner logins reset whenever the server restarts.');
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'owner', exp: Date.now() + TOKEN_DAYS * 86400000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  if (!sig || sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'owner' && data.exp > Date.now();
  } catch {
    return false;
  }
}

function passwordMatches(input) {
  const a = crypto.createHash('sha256').update(String(input || '')).digest();
  const b = crypto.createHash('sha256').update(PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}

function tokenFrom(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function isOwner(req) {
  if (!enabled) return !PRODUCTION;
  return verifyToken(tokenFrom(req));
}

function requireOwner(req, res, next) {
  if (isOwner(req)) return next();
  if (!enabled && PRODUCTION) {
    return res.status(503).json({ message: 'Owner area is locked. Set ADMIN_PASSWORD on the server.' });
  }
  return res.status(401).json({ message: 'Owner login required' });
}

function login(req, res) {
  if (!enabled) {
    return res.status(PRODUCTION ? 503 : 200).json(
      PRODUCTION ? { message: 'Set ADMIN_PASSWORD on the server first.' } : { token: '', owner: true }
    );
  }
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.reset > now && entry.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((entry.reset - now) / 60000);
    return res.status(429).json({ message: `Too many attempts. Try again in ${mins} min.` });
  }
  const password = req.body?.password;
  if (typeof password !== 'string' || !password || password.length > 200 || !passwordMatches(password)) {
    const next = entry && entry.reset > now ? entry : { count: 0, reset: now + WINDOW_MS };
    next.count += 1;
    attempts.set(key, next);
    return res.status(401).json({ errors: { password: 'Wrong password' } });
  }
  attempts.delete(key);
  return res.json({ token: issueToken(), owner: true });
}

function me(req, res) {
  res.json({ owner: isOwner(req), authEnabled: enabled });
}

module.exports = { requireOwner, login, me, isOwner };
