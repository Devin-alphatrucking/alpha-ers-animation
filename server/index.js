const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);

const express = require('express');
const cors = require('cors');
const dayjs = require('dayjs');
const { niches, currencies, listNiches } = require('./data/nichePresets');
const store = require('./data/store');
const prospects = require('./data/prospects');
const auth = require('./lib/auth');
const offer = require('./data/offer');
const { validateProspect, validateActivity, rowsFromCsv } = require('./lib/validateProspect');

const app = express();
const PORT = process.env.PORT || 4000;
const PRODUCTION = process.env.NODE_ENV === 'production';
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

app.set('trust proxy', 1);
app.disable('x-powered-by');
if (!PRODUCTION) app.use(cors());
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use('/api', (req, _res, next) => {
  const id = req.get('x-demo-id') || '';
  req.sid = /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : 'shared';
  next();
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function money(amount, symbol) {
  return `${symbol}${Number(amount).toLocaleString('en-US')}`;
}

function nextOpenSlot() {
  const d = dayjs().add(1, 'day').hour(11).minute(0).second(0).millisecond(0);
  return { label: d.format('ddd h:mm A'), iso: d.toISOString() };
}

function generateAiReply(business, userText, lastServiceId) {
  const preset = niches[business.nicheId] || niches.medspa;
  const t = (userText || '').toLowerCase();
  const symbol = business.currency;
  const services = business.services || preset.services;
  const slot = nextOpenSlot();
  const find = (id) => services.find((s) => s.id === id) || services[0];
  const pack = (text, serviceId) => ({ text, serviceId: serviceId || lastServiceId || null });
  const mentions = (keys) => keys.some((k) => t.includes(k));

  if (!t.trim()) {
    return pack(`Hi, this is ${business.name} in ${business.city}. How can we help you today?`);
  }

  if (mentions(['human', 'person', 'manager', 'owner', 'real person'])) {
    return pack(
      `Absolutely — I’ll flag ${business.ownerFirstName} (${business.ownerTitle}) right now. Meanwhile I can still hold a time so you don’t lose the slot.`
    );
  }

  if (business.nicheId === 'medspa') {
    if (mentions(preset.keywords.botox)) {
      const s = find('botox');
      return pack(
        `Botox is ${money(s.price, symbol)} per area (about ${s.duration} min). First visit includes a complimentary consult and we can often treat the same day. ${slot.label} is open — want me to hold it?`,
        s.id
      );
    }
    if (mentions(preset.keywords.hydra)) {
      const s = find('hydrafacial');
      return pack(
        `Hydrafacial Signature is ${money(s.price, symbol)} / ${s.duration} min. ${slot.label} or later this week. I can lock it with a $50 hold that applies to the service.`,
        s.id
      );
    }
    if (mentions(preset.keywords.filler)) {
      const s = find('lip-filler');
      return pack(
        `Lip Filler 1ml is ${money(s.price, symbol)}. Consult is free for new patients. ${slot.label} is available at ${business.name}. Shall I book you?`,
        s.id
      );
    }
    if (mentions(preset.keywords.laser)) {
      const s = find('laser');
      return pack(
        `Laser hair (small area) is ${money(s.price, symbol)} per session. Packages drop the per-visit price ~20%. I can schedule a quick consult at ${slot.label}.`,
        s.id
      );
    }
  }

  if (business.nicheId === 'dental') {
    if (mentions(preset.keywords.emergency) || mentions(['pain', 'hurt', 'swollen', 'broke'])) {
      const s = find('emergency');
      return pack(
        `Sorry you’re in pain — we hold same-day emergency exams (${money(s.price, symbol)}, credited if you treat today). I can get you in this afternoon. Confirm and I’ll freeze the chair.`,
        s.id
      );
    }
    if (mentions(preset.keywords.invisalign)) {
      const s = find('invisalign');
      return pack(
        `Invisalign consult is complimentary at ${business.name}. We scan in-office and review an estimate the same visit. ${slot.label} is open.`,
        s.id
      );
    }
    if (mentions(preset.keywords.whitening)) {
      const s = find('whitening');
      return pack(
        `Professional whitening is ${money(s.price, symbol)} / ${s.duration} min. ${slot.label} is available — perfect if you have an event coming up.`,
        s.id
      );
    }
    if (mentions(preset.keywords.implant)) {
      const s = find('implant');
      return pack(
        `Implant consult is complimentary. Bring any existing X-rays if you have them. ${slot.label} with Dr. team?`,
        s.id
      );
    }
  }

  if (business.nicheId === 'detailing') {
    if (mentions(preset.keywords.ceramic)) {
      const s = find('ceramic');
      return pack(
        `5-year ceramic coating starts at ${money(s.price, symbol)} (1-day drop-off). 20% deposit locks the bay. What vehicle? I have ${slot.label} open.`,
        s.id
      );
    }
    if (mentions(preset.keywords.ppf)) {
      const s = find('ppf');
      return pack(
        `Partial PPF (hood + bumper) starts at ${money(s.price, symbol)}. For trucks/SUVs we prefer a 20-min in-person quote — ${slot.label} works.`,
        s.id
      );
    }
    if (mentions(preset.keywords.interior)) {
      const s = find('interior');
      return pack(
        `Full interior detail is ${money(s.price, symbol)} (~3 hrs). Pet hair is included. Drop-off ${slot.label} at ${business.name}?`,
        s.id
      );
    }
  }

  if (business.nicheId === 'homeservices') {
    if (mentions(preset.keywords.leak) || mentions(['flood', 'burst'])) {
      const s = find('leak');
      return pack(
        `Emergency leak stop is ${money(s.price, symbol)} trip + parts. Share your ZIP and I can dispatch a tech in the next 90 minutes.`,
        s.id
      );
    }
    if (mentions(preset.keywords.ac) || mentions(['hot', 'not cooling', 'no cool'])) {
      const s = find('diagnostic');
      return pack(
        `No-cool diagnostic is ${money(s.price, symbol)} (credited if you approve repair). I have a ${slot.label.replace(/^\w+ /, '')} window tomorrow — what’s the ZIP in ${business.city}?`,
        s.id
      );
    }
    if (mentions(preset.keywords.roof) || mentions(['shingle', 'storm'])) {
      const s = find('roof');
      return pack(
        `Roof inspection is ${money(s.price, symbol)} with insurance-ready photos. ${slot.label} in ${business.city}. Want that window?`,
        s.id
      );
    }
    if (mentions(['tune', 'maintenance', 'checkup'])) {
      const s = find('tuneup');
      return pack(`AC tune-up is ${money(s.price, symbol)}. ${slot.label} is open. Members get priority + 15% off repairs.`, s.id);
    }
  }

  const trimmed = (userText || '').trim();
  const isConfirm =
    /^(yes|yeah|yep|ok|okay|please|sure)([,!. ]+(please|book( it)?|lock it|do it|confirm)?)?[!.,]*$/i.test(
      trimmed
    ) || /^(book it|lock it|hold it|sounds good|let'?s do it)$/i.test(trimmed);

  if (isConfirm) {
    const top = (lastServiceId && services.find((s) => s.id === lastServiceId)) || services.find((s) => s.popular) || services[0];
    return pack(
      `Booked ${top.name} for ${slot.label} at ${business.name}. I’ll text a reminder 24h and 2h before. Anything the technician/provider should know?`,
      top.id
    );
  }

  if (mentions(preset.keywords.price || ['price', 'cost', 'how much'])) {
    const popular = services.filter((s) => s.popular).slice(0, 3);
    const list = popular
      .map((s) => `${s.name} ${s.price ? money(s.price, symbol) : 'complimentary'}`)
      .join(' · ');
    return pack(
      `Quick menu: ${list}. Tell me the service and a preferred day — I’ll hold the next open time (${slot.label}).`
    );
  }

  if (mentions(preset.keywords.book || ['book', 'appointment', 'available', 'schedule'])) {
    const top = (lastServiceId && services.find((s) => s.id === lastServiceId)) || services.find((s) => s.popular) || services[0];
    return pack(
      `${slot.label} is open for ${top.name} (${top.price ? money(top.price, symbol) : 'complimentary'}). Reply YES and I’ll lock it + send a reminder.`,
      top.id
    );
  }

  if (mentions(['thank', 'thanks', 'thx'])) {
    return pack(`Anytime — we’re here 24/7 by text. If plans change, reply CANCEL and I’ll free the slot.`);
  }

  const top = services[0];
  return pack(
    `Thanks for reaching ${business.name}. We can help with ${top.name} and more. Are you looking for pricing, a same-week booking, or something else?`
  );
}

function addActivity(state, type, text) {
  state.activity.unshift({
    id: store.uid('act'),
    type,
    text,
    at: new Date().toISOString()
  });
  state.activity = state.activity.slice(0, 12);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, product: 'PulseLocal AI', storage: prospects.backend.name, time: new Date().toISOString() });
});

app.get('/api/auth/me', auth.me);
app.post('/api/auth/login', auth.login);

const trackHits = new Map();
setInterval(() => trackHits.clear(), 10 * 60 * 1000).unref();

function deviceFrom(ua = '') {
  if (/iPhone|iPod/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'Android' : 'Android tablet';
  if (/Macintosh|Windows|Linux|CrOS/i.test(ua)) return 'Desktop';
  return '';
}

app.post('/api/track', wrap(async (req, res) => {
  const ip = req.ip || 'unknown';
  const hits = (trackHits.get(ip) || 0) + 1;
  trackHits.set(ip, hits);
  if (hits > 300) return res.status(429).end();

  const { ref, visitId, type, page, action } = req.body || {};
  if (
    typeof ref !== 'string' ||
    !/^[a-z0-9]{10}$/.test(ref) ||
    typeof visitId !== 'string' ||
    !/^[A-Za-z0-9_-]{8,40}$/.test(visitId) ||
    !['open', 'page', 'action', 'ping'].includes(type)
  ) {
    return res.status(204).end();
  }
  await prospects.recordView(ref, visitId, {
    type,
    page: prospects.PAGES.includes(page) ? page : undefined,
    action: prospects.ACTIONS.includes(action) ? action : undefined,
    device: deviceFrom(req.get('user-agent'))
  });
  res.status(204).end();
}));

app.get('/api/offer', wrap(async (_req, res) => {
  res.json(await offer.publicOffer());
}));

app.get('/api/checkout/:plan', wrap(async (req, res) => {
  const plan = offer.PLAN_IDS.includes(req.params.plan) ? req.params.plan : null;
  if (!plan) return res.redirect(302, '/pricing');
  const ref = String(req.query.ref || '');
  const visitId = String(req.query.v || '');
  if (/^[a-z0-9]{10}$/.test(ref) && /^[A-Za-z0-9_-]{8,40}$/.test(visitId)) {
    await prospects.recordView(ref, visitId, {
      type: 'action',
      action: `checkout_${plan}`,
      device: deviceFrom(req.get('user-agent'))
    });
  }
  const link = await offer.checkoutLink(plan);
  res.set('Cache-Control', 'no-store');
  res.redirect(302, link || `/pricing?reserve=${plan}`);
}));

const onboardingHits = new Map();
setInterval(() => onboardingHits.clear(), 60 * 60 * 1000).unref();

function validateOnboarding(body = {}) {
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  const errors = {};
  const value = {
    plan: offer.PLAN_IDS.includes(body.plan) ? body.plan : '',
    businessName: s(body.businessName),
    contactName: s(body.contactName),
    email: s(body.email).toLowerCase(),
    phone: s(body.phone),
    googleUrl: s(body.googleUrl),
    notes: s(body.notes)
  };
  if (value.businessName.length < 2 || value.businessName.length > 60) errors.businessName = 'Enter your business name';
  if (value.contactName.length < 2 || value.contactName.length > 50 || !/^[\p{L}][\p{L} .'-]*$/u.test(value.contactName)) {
    errors.contactName = 'Enter your name (letters only)';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email) || value.email.length > 80) errors.email = 'Enter a valid email';
  const digits = value.phone.replace(/\D/g, '');
  if (!value.phone || digits.length < 10 || digits.length > 15 || !/^[+\d][\d\s().-]*$/.test(value.phone)) {
    errors.phone = 'Enter a mobile number with country code';
  }
  if (value.googleUrl) {
    try {
      const u = new URL(/^https?:\/\//i.test(value.googleUrl) ? value.googleUrl : `https://${value.googleUrl}`);
      if (!u.hostname.includes('.')) throw new Error('bad');
      value.googleUrl = u.toString();
    } catch {
      errors.googleUrl = 'Paste your Google Business or Maps link';
    }
  }
  if (value.notes.length > 500) errors.notes = 'Keep it under 500 characters';
  return { ok: Object.keys(errors).length === 0, errors, value };
}

app.post('/api/onboarding', wrap(async (req, res) => {
  const ip = req.ip || 'unknown';
  const hits = (onboardingHits.get(ip) || 0) + 1;
  onboardingHits.set(ip, hits);
  if (hits > 10) return res.status(429).json({ message: 'Too many submissions. Please message us directly instead.' });

  const result = validateOnboarding(req.body);
  if (!result.ok) return res.status(422).json({ errors: result.errors });
  const v = result.value;
  const planName = { starter: 'Starter', growth: 'Growth', premium: 'Premium', setup: 'Done-for-you setup' }[v.plan] || 'No plan picked';
  const summary = `Onboarding form: ${planName} · ${v.contactName} · ${v.email} · ${v.phone}${v.googleUrl ? ' · Google profile added' : ''}`;
  const notes = [`Onboarding (${new Date().toLocaleDateString('en-CA')}): ${planName}`, v.googleUrl && `Google: ${v.googleUrl}`, v.notes && `Notes: ${v.notes}`]
    .filter(Boolean)
    .join('\n');

  let p = await prospects.findByRef(String(req.body?.ref || ''));
  if (!p) p = await prospects.findDuplicate({ email: v.email, businessName: v.businessName, city: '' });
  if (!p) {
    const biz = store.getState(req.sid).business;
    const created = validateProspect({
      businessName: v.businessName,
      ownerName: v.contactName,
      nicheId: biz.nicheId,
      city: biz.city,
      currencyCode: biz.currencyCode,
      email: v.email,
      phone: v.phone,
      website: v.googleUrl,
      stage: 'replied'
    });
    if (created.ok) p = await prospects.create(created.value);
    else console.warn('[onboarding] Could not create prospect:', created.errors);
  }
  if (p) await prospects.addOnboarding(p, summary, notes);
  res.json({ ok: true });
}));

app.use(['/api/prospects', '/api/outreach', '/api/settings'], auth.requireOwner);

app.get('/api/settings', wrap(async (_req, res) => {
  res.json(await offer.getOffer());
}));

app.put('/api/settings', wrap(async (req, res) => {
  const result = offer.validateOffer(req.body);
  if (!result.ok) return res.status(422).json({ errors: result.errors });
  res.json(await offer.saveOffer(result.value));
}));

app.get('/api/niches', (_req, res) => {
  res.json({ niches: listNiches(), currencies: Object.values(currencies) });
});

app.get('/api/state', (req, res) => {
  res.json(store.getState(req.sid));
});

app.post('/api/reset', (req, res) => {
  const { nicheId } = req.body || {};
  res.json(store.reset(req.sid, nicheId || 'medspa'));
});

app.post('/api/personalize', (req, res) => {
  const body = req.body || {};
  res.json(
    store.personalize(req.sid, {
      nicheId: body.nicheId,
      businessName: body.businessName,
      city: body.city,
      currencyCode: body.currencyCode,
      rating: body.rating,
      ownerFirstName: body.ownerFirstName,
      region: body.region
    })
  );
});

app.post('/api/leads/:id/reply', (req, res) => {
  const { text, from } = req.body || {};
  const state = store.updateState(req.sid, (s) => {
    const lead = s.leads.find((l) => l.id === req.params.id);
    if (!lead) return;
    const who = from === 'ai' ? 'ai' : 'staff';
    lead.messages.push({
      id: store.uid('msg'),
      from: who,
      text: text || 'We’ll take it from here — thanks for waiting.',
      at: new Date().toISOString()
    });
    lead.unread = false;
    lead.status = 'human-replied';
    lead.preview = text || lead.preview;
  });
  res.json(state);
});

app.post('/api/leads/:id/ai-reply', (req, res) => {
  const { text } = req.body || {};
  let reply = '';
  const state = store.updateState(req.sid, (s) => {
    const lead = s.leads.find((l) => l.id === req.params.id);
    if (!lead) return;
    lead.messages.push({
      id: store.uid('msg'),
      from: 'customer',
      text,
      at: new Date().toISOString()
    });
    const generated = generateAiReply(s.business, text, lead.lastServiceId);
    reply = generated.text;
    if (generated.serviceId) lead.lastServiceId = generated.serviceId;
    lead.messages.push({
      id: store.uid('msg'),
      from: 'ai',
      text: reply,
      at: new Date().toISOString()
    });
    lead.preview = text;
    lead.unread = false;
    lead.status = 'ai-handling';
  });
  res.json({ state, reply });
});

app.post('/api/simulate/missed-call', (req, res) => {
  const customer = (req.body && req.body.customer) || 'New caller';
  const phone = (req.body && req.body.phone) || '+1 (214) 555-0199';
  const state = store.updateState(req.sid, (s) => {
    const opener = `Hi, this is ${s.business.name} — sorry we missed your call just now. Are you looking to book, get pricing, or something urgent? Reply here and I’ll help in seconds.`;
    const lead = {
      id: store.uid('lead'),
      name: customer,
      phone,
      channel: 'sms',
      preview: 'Missed call · AI text-back sent in 8s',
      status: 'ai-handling',
      value: s.business.services.find((x) => x.popular)?.price || 0,
      service: 'Missed-call recovery',
      unread: true,
      createdAt: new Date().toISOString(),
      responseSecs: 8,
      messages: [
        {
          id: store.uid('msg'),
          from: 'system',
          text: `Missed call from ${phone}`,
          at: new Date().toISOString()
        },
        {
          id: store.uid('msg'),
          from: 'ai',
          text: opener,
          at: new Date().toISOString()
        }
      ]
    };
    s.leads.unshift(lead);
    s.simulator = {
      channel: 'sms',
      leadId: lead.id,
      messages: lead.messages
    };
    s.metrics.missedCallsSaved += 1;
    s.metrics.leadsCaught += 1;
    addActivity(s, 'missed-call', `Missed call recovered — AI texted ${customer} in 8s`);
  });
  res.json(state);
});

app.post('/api/simulate/instagram', (req, res) => {
  const customer = (req.body && req.body.customer) || 'IG prospect';
  const state = store.updateState(req.sid, (s) => {
    const top = s.business.services.find((x) => x.popular) || s.business.services[0];
    const inbound = `Hey do you have openings for ${top.name}?`;
    const generated = generateAiReply(s.business, inbound);
    const lead = {
      id: store.uid('lead'),
      name: customer,
      phone: '@' + customer.toLowerCase().replace(/\s+/g, ''),
      channel: 'instagram',
      preview: inbound,
      status: 'ai-handling',
      value: top.price,
      service: top.name,
      lastServiceId: generated.serviceId || top.id,
      unread: true,
      createdAt: new Date().toISOString(),
      responseSecs: 6,
      messages: [
        { id: store.uid('msg'), from: 'customer', text: inbound, at: new Date().toISOString() },
        { id: store.uid('msg'), from: 'ai', text: generated.text, at: new Date().toISOString() }
      ]
    };
    s.leads.unshift(lead);
    s.simulator = {
      channel: 'instagram',
      leadId: lead.id,
      messages: lead.messages,
      lastServiceId: lead.lastServiceId
    };
    s.metrics.leadsCaught += 1;
    addActivity(s, 'booking', `Instagram DM auto-replied for ${customer}`);
  });
  res.json(state);
});

app.post('/api/chat', (req, res) => {
  const { text, channel } = req.body || {};
  let reply = '';
  const state = store.updateState(req.sid, (s) => {
    const generated = generateAiReply(s.business, text, s.simulator?.lastServiceId);
    reply = generated.text;
    const msgIn = {
      id: store.uid('msg'),
      from: 'customer',
      text: text || '',
      at: new Date().toISOString()
    };
    const msgOut = {
      id: store.uid('msg'),
      from: 'ai',
      text: reply,
      at: new Date().toISOString()
    };

    if (s.simulator && s.simulator.leadId) {
      const lead = s.leads.find((l) => l.id === s.simulator.leadId);
      if (lead) {
        lead.messages.push(msgIn, msgOut);
        lead.preview = text;
        lead.status = 'ai-handling';
        if (generated.serviceId) lead.lastServiceId = generated.serviceId;
        s.simulator.messages = lead.messages;
        s.simulator.channel = channel || s.simulator.channel;
        s.simulator.lastServiceId = generated.serviceId || s.simulator.lastServiceId;
      }
    } else {
      s.simulator = {
        channel: channel || 'sms',
        messages: [msgIn, msgOut],
        lastServiceId: generated.serviceId
      };
    }

    const booked = /booked /i.test(reply);
    if (booked) {
      const serviceId = generated.serviceId || s.simulator.lastServiceId;
      const top =
        s.business.services.find((x) => x.id === serviceId) ||
        s.business.services.find((x) => x.popular) ||
        s.business.services[0];
      const slot = nextOpenSlot();
      s.bookings.unshift({
        id: store.uid('bkg'),
        customer: 'Live demo guest',
        phone: '+1 (214) 555-0100',
        service: top.name,
        serviceId: top.id,
        price: top.price,
        duration: top.duration,
        start: slot.iso,
        status: 'confirmed',
        deposit: top.price >= 400 ? Math.round(top.price * 0.2) : 0,
        reminders: ['queued'],
        source: channel === 'instagram' ? 'Instagram DM' : 'AI text-back',
        notes: 'Created from live simulator'
      });
      s.metrics.bookingsFromAi += 1;
      s.metrics.revenueRecovered += top.price;
      addActivity(s, 'booking', `AI booked ${top.name} from live chat`);
    }
  });
  res.json({ reply, state });
});

app.post('/api/bookings', (req, res) => {
  const body = req.body || {};
  const state = store.updateState(req.sid, (s) => {
    const service =
      s.business.services.find((x) => x.id === body.serviceId) || s.business.services[0];
    const start = body.start ? dayjs(body.start) : dayjs().add(1, 'day').hour(11).minute(0);
    s.bookings.unshift({
      id: store.uid('bkg'),
      customer: body.customer || 'Website visitor',
      phone: body.phone || '',
      service: service.name,
      serviceId: service.id,
      price: service.price,
      duration: service.duration,
      start: start.toISOString(),
      status: 'confirmed',
      deposit: service.price >= 400 ? Math.round(service.price * 0.2) : 0,
      reminders: ['queued'],
      source: body.source || 'Booking page',
      notes: body.notes || ''
    });
    s.metrics.bookingsFromAi += 1;
    s.metrics.revenueRecovered += service.price;
    addActivity(s, 'booking', `${body.customer || 'Visitor'} booked ${service.name} via public page`);
  });
  res.json(state);
});

app.patch('/api/bookings/:id', (req, res) => {
  const { status } = req.body || {};
  const state = store.updateState(req.sid, (s) => {
    const b = s.bookings.find((x) => x.id === req.params.id);
    if (b && status) b.status = status;
  });
  res.json(state);
});

app.post('/api/bookings/:id/complete-and-review', (req, res) => {
  const state = store.updateState(req.sid, (s) => {
    const b = s.bookings.find((x) => x.id === req.params.id);
    if (!b) return;
    b.status = 'completed';
    b.reviewRequestedAt = new Date().toISOString();
    s.reviewCampaigns.sent += 1;
    addActivity(s, 'review', `Review request sent to ${b.customer} after ${b.service}`);
  });
  res.json(state);
});

app.post('/api/reviews/request', (req, res) => {
  const { customer } = req.body || {};
  const state = store.updateState(req.sid, (s) => {
    s.reviewCampaigns.sent += 1;
    addActivity(s, 'review', `Manual review request sent${customer ? ` to ${customer}` : ''}`);
  });
  res.json(state);
});

app.post('/api/reviews/submit', (req, res) => {
  const { stars, text, customer } = req.body || {};
  const rating = Number(stars) || 5;
  const state = store.updateState(req.sid, (s) => {
    if (rating >= 4) {
      s.reviews.unshift({
        id: store.uid('rev'),
        stars: rating,
        text: text || 'Great experience — booked so easily.',
        platform: 'google',
        customer: customer || 'Happy customer',
        createdAt: new Date().toISOString(),
        source: 'review funnel',
        status: 'published'
      });
      s.metrics.reviewsGained += 1;
      s.reviewCampaigns.fiveStarClicks += 1;
      s.business.reviewCount += 1;
      addActivity(s, 'review', `${rating}★ routed to Google Maps`);
    } else {
      s.privateFlags.unshift({
        id: store.uid('flag'),
        customer: customer || 'Guest',
        stars: rating,
        reason: text || 'Private feedback submitted',
        createdAt: new Date().toISOString(),
        status: 'open',
        intercepted: true
      });
      s.reviewCampaigns.intercepted += 1;
      addActivity(s, 'shield', `Negative Review Shield intercepted a ${rating}★`);
    }
  });
  res.json({
    route: rating >= 4 ? 'google' : 'private',
    googleUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.business.googleQuery)}`,
    state
  });
});

app.post('/api/reviews/resolve', (req, res) => {
  const { id } = req.body || {};
  const state = store.updateState(req.sid, (s) => {
    const flag = s.privateFlags.find((f) => f.id === id);
    if (flag) flag.status = 'resolved';
  });
  res.json(state);
});

app.get('/api/outreach', wrap(async (req, res) => {
  const s = store.getState(req.sid);
  const b = s.business;
  const requested = String(req.query.origin || '');
  const origin = /^https?:\/\/[^\s/]+$/i.test(requested) ? requested : `${req.protocol}://${req.get('host')}`;
  const tracked = req.query.prospect ? await prospects.get(String(req.query.prospect)) : null;
  const ref = tracked && tracked.businessName === b.name ? `&ref=${tracked.trackId}` : '';
  const demoLink = `${origin}/?biz=${encodeURIComponent(b.name)}&niche=${b.nicheId}&city=${encodeURIComponent(b.city)}&currency=${b.currencyCode}&rating=${b.rating}&owner=${encodeURIComponent(b.ownerFirstName)}${ref}`;
  const top = b.services.find((x) => x.popular) || b.services[0];
  const lostJobs = Math.max(4, Math.round(s.metrics.missedCallsSaved / 8));
  const o = await offer.getOffer();
  const P = o.plans;
  const monthlyPrices = ['starter', 'growth', 'premium'].filter((id) => P[id].enabled).map((id) => P[id].price);
  const headline = P.growth.enabled ? P.growth.price : monthlyPrices[0] || P.growth.price;
  const priceRange = monthlyPrices.length
    ? `$${Math.min(...monthlyPrices)}${monthlyPrices.length > 1 ? `–$${Math.max(...monthlyPrices)}` : ''}/mo`
    : `$${headline}/mo`;
  const setupLine = P.setup.enabled ? ` (or $${P.setup.price} setup + $${P.setup.monthly}/mo)` : '';
  const signature = o.founderName || 'Devin';
  const saveVsPodium = s.metrics.competitorMonthly - headline;

  const instagramDm = `Hey ${b.ownerFirstName} — noticed ${b.name} is at ${b.rating}★ on Google in ${b.city}.

Quick question: when someone DMs you about ${top.name} while you're with a client, how fast do they get a reply?

Most ${b.industryPhrase} owners I talk to in ${b.city} lose ${lostJobs}–${lostJobs + 4} booked jobs a week from slow replies + missed calls.

I loaded a live demo with ${b.name} already on it — AI catches the lead, books it, then auto-asks for a Google review after the visit:

${demoLink}

Takes 60 seconds. If it isn't an obvious yes, ignore me.`;

  const coldEmail = `Subject: ${b.name} is leaking bookings in ${b.city}

Hi ${b.ownerFirstName},

I was looking at ${b.industryPhrase} businesses in ${b.city} and ${b.name} stood out (${b.rating}★ / ${b.reviewCount} reviews).

The pattern I keep seeing: the owner is delivering the work, the phone rings, Instagram DMs sit for 2–6 hours, and ${b.competitorName} takes the job.

${o.brandName} is a 24/7 receptionist built for ${b.shortLabel.toLowerCase()} shops:
• Missed-call text-back in under 15 seconds
• Instagram + website questions answered with your real prices
• Booking + no-show reminders
• 5-star Google funnel with a “negative review shield” so 1–3★ never go public

Your competitors pay Podium ~$${s.metrics.competitorMonthly}/mo. I set this up for ${priceRange}${setupLine}.

Live demo branded as ${b.name}:
${demoLink}

If you want, I’ll personalize the AI on a 10-min call this week.

— ${signature}`;

  const loomScript = `Hook (0:00): “${b.ownerFirstName}, I built this as if ${b.name} already used it.”
0:15 Dashboard: point at Revenue Recovered and missed calls saved.
0:40 Click Simulate Missed Call — show the phone texting back in 8 seconds.
1:10 Ask the AI “how much for ${top.name}?” — it quotes ${b.currency}${top.price}.
1:40 Bookings: Complete & Request Review.
2:00 Review funnel: 5★ goes to Google, 2★ is intercepted privately.
2:20 Pricing page: $${headline}/mo vs Podium $${s.metrics.competitorMonthly}, then the Pay button. Pause and wait.`;

  const whatsapp = `Hi ${b.ownerFirstName}, I put ${b.name} into a live AI receptionist demo (missed calls, IG DMs, Google reviews). 60-sec look: ${demoLink}`;

  res.json({
    demoLink,
    instagramDm,
    coldEmail,
    loomScript,
    whatsapp,
    pricing: {
      starter: P.starter.price,
      growth: P.growth.price,
      premium: P.premium.price,
      setup: P.setup.price,
      maintenance: P.setup.monthly,
      enabled: Object.fromEntries(offer.PLAN_IDS.map((id) => [id, P[id].enabled])),
      podium: s.metrics.competitorMonthly,
      monthlySaved: saveVsPodium,
      yearlySaved: saveVsPodium * 12
    }
  });
}));

app.get('/api/prospects', wrap(async (_req, res) => {
  res.json({ prospects: await prospects.list() });
}));

app.post('/api/prospects', wrap(async (req, res) => {
  const result = validateProspect(req.body);
  if (!result.ok) return res.status(422).json({ errors: result.errors });
  const dup = await prospects.findDuplicate(result.value);
  if (dup) {
    return res.status(409).json({ errors: { businessName: `Already in your pipeline as “${dup.businessName}” (${dup.city})` } });
  }
  const prospect = await prospects.create(result.value);
  res.status(201).json({ prospect, prospects: await prospects.list() });
}));

app.patch('/api/prospects/:id', wrap(async (req, res) => {
  const result = validateProspect(req.body, { partial: true });
  if (!result.ok) return res.status(422).json({ errors: result.errors });
  if (result.value.businessName || result.value.email || result.value.instagram) {
    const current = await prospects.get(req.params.id);
    if (!current) return res.status(404).json({ message: 'Prospect not found' });
    const merged = { ...current, ...result.value };
    if (!merged.email && !merged.instagram) {
      return res.status(422).json({ errors: { email: 'Add an email or an Instagram handle' } });
    }
    const dup = await prospects.findDuplicate(merged, req.params.id);
    if (dup) return res.status(409).json({ errors: { businessName: `Duplicate of “${dup.businessName}” (${dup.city})` } });
  }
  const prospect = await prospects.update(req.params.id, result.value);
  if (!prospect) return res.status(404).json({ message: 'Prospect not found' });
  res.json({ prospect, prospects: await prospects.list() });
}));

app.delete('/api/prospects/:id', wrap(async (req, res) => {
  if (!(await prospects.remove(req.params.id))) return res.status(404).json({ message: 'Prospect not found' });
  res.json({ prospects: await prospects.list() });
}));

app.post('/api/prospects/:id/activity', wrap(async (req, res) => {
  const result = validateActivity(req.body);
  if (!result.ok) return res.status(422).json({ errors: result.errors });
  const prospect = await prospects.addActivity(req.params.id, result.value);
  if (!prospect) return res.status(404).json({ message: 'Prospect not found' });
  res.json({ prospect, prospects: await prospects.list() });
}));

app.post('/api/prospects/import', wrap(async (req, res) => {
  const csv = String(req.body?.csv || '');
  const dryRun = Boolean(req.body?.dryRun);
  if (!csv.trim()) return res.status(422).json({ message: 'Paste CSV text or choose a file' });
  const parsed = rowsFromCsv(csv);
  if (parsed.error) return res.status(422).json({ message: parsed.error });
  if (parsed.items.length > 500) return res.status(422).json({ message: 'Import up to 500 rows at a time' });

  const valid = [];
  const skipped = [];
  const existing = await prospects.list();
  for (const { line, data } of parsed.items) {
    const result = validateProspect(data);
    if (!result.ok) {
      skipped.push({ line, businessName: data.businessName, errors: Object.values(result.errors) });
      continue;
    }
    const pool = [...existing, ...valid.map((v) => v.value)];
    if (await prospects.findDuplicate(result.value, null, pool)) {
      skipped.push({ line, businessName: data.businessName, errors: ['Duplicate — already in pipeline or earlier in this file'] });
      continue;
    }
    valid.push({ line, value: result.value });
  }

  if (dryRun) {
    return res.json({
      total: parsed.items.length,
      ready: valid.map((v) => ({ line: v.line, businessName: v.value.businessName, city: v.value.city, nicheId: v.value.nicheId })),
      skipped
    });
  }
  const created = await prospects.createMany(valid.map((v) => v.value));
  res.json({ imported: created.length, skipped, prospects: await prospects.list() });
}));

app.post('/api/prospects/reset', wrap(async (_req, res) => {
  res.json({ prospects: await prospects.reset() });
}));

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

if (fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d', setHeaders: (res, file) => {
    if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  } }));
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Upload is too large (1 MB max)' });
  console.error(err);
  const dbDown = /mongo|ECONNREFUSED|ENOTFOUND|Server selection/i.test(String(err.message));
  res.status(dbDown ? 503 : 500).json({
    message: dbDown ? 'Pipeline database is unreachable. Check MONGODB_URI and Atlas network access.' : 'Something went wrong on the server'
  });
});

app.listen(PORT, () => {
  console.log(`PulseLocal AI running on http://localhost:${PORT} · pipeline storage: ${prospects.backend.name}`);
  if (prospects.backend.connect) {
    prospects.backend
      .connect()
      .then(() => console.log('[db] Connected to MongoDB'))
      .catch((err) => console.error('[db] MongoDB connection failed:', err.message));
  }
});
