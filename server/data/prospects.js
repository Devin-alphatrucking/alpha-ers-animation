const crypto = require('crypto');
const backend = require('./prospectsBackend');

const DAY = 86400000;

const stageLabels = {
  new: 'New',
  contacted: 'Contacted',
  replied: 'Replied',
  demo: 'Demo booked',
  won: 'Won',
  lost: 'Lost'
};

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function iso(offsetDays, hour = 10) {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function act(type, text, daysAgo) {
  return { id: uid('pa'), type, text, at: new Date(Date.now() - daysAgo * DAY).toISOString() };
}

function trackId() {
  return crypto.randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).padEnd(10, '0').toLowerCase();
}

function freshTracking() {
  return { trackId: trackId(), views: 0, lastViewedAt: null, visits: [] };
}

const PAGE_LABELS = { overview: 'Overview', inbox: 'Inbox', bookings: 'Bookings', reviews: 'Reviews' };
const ACTION_LABELS = {
  missed_call: 'missed-call text-back',
  instagram: 'Instagram auto-reply',
  chat: 'chatted with the AI',
  booking: 'made a booking',
  review: 'tried the review funnel',
  roi: 'used the ROI calculator'
};

function duration(seconds) {
  if (seconds < 60) return `${Math.max(5, Math.round(seconds / 5) * 5)} sec`;
  return `${Math.round(seconds / 60)} min`;
}

function visitText(v) {
  const parts = [`Opened your demo${v.device ? ` on ${v.device}` : ''}`, duration(v.seconds)];
  const pages = v.pages.filter((p) => p !== 'overview').map((p) => PAGE_LABELS[p]);
  if (pages.length) parts.push(`viewed ${pages.join(', ')}`);
  if (v.actions.length) parts.push(v.actions.map((a) => ACTION_LABELS[a]).join(', '));
  return parts.join(' · ');
}

function seed() {
  const base = [
    {
      businessName: 'Glow Theory Aesthetics',
      ownerName: 'Rachel',
      nicheId: 'medspa',
      city: 'Scottsdale',
      country: 'USA',
      currencyCode: 'USD',
      rating: 4.5,
      instagram: 'glowtheory.az',
      email: 'hello@glowtheory.example',
      stage: 'contacted',
      dealValue: 79,
      nextFollowUp: iso(0, 17),
      activity: [act('note', 'Added to pipeline', 4), act('dm', 'Instagram DM sent with branded demo', 2)]
    },
    {
      businessName: 'Northside Family Dental',
      ownerName: 'James',
      nicheId: 'dental',
      city: 'Leeds',
      country: 'United Kingdom',
      currencyCode: 'GBP',
      rating: 4.3,
      email: 'reception@northsidedental.example',
      stage: 'new',
      dealValue: 99,
      activity: [act('note', 'Added to pipeline', 1)]
    },
    {
      businessName: 'Shine Lab Detailing',
      ownerName: 'Liam',
      nicheId: 'detailing',
      city: 'Melbourne',
      country: 'Australia',
      currencyCode: 'AUD',
      rating: 4.8,
      instagram: 'shinelab.mel',
      stage: 'replied',
      dealValue: 79,
      nextFollowUp: iso(-1, 11),
      activity: [
        act('note', 'Added to pipeline', 6),
        act('dm', 'Instagram DM sent', 5),
        act('reply', '“How does the missed-call thing work?”', 2)
      ]
    },
    {
      businessName: 'Cool Breeze HVAC',
      ownerName: 'Mike',
      nicheId: 'homeservices',
      city: 'Houston',
      country: 'USA',
      currencyCode: 'USD',
      rating: 4.2,
      email: 'office@coolbreezehvac.example',
      phone: '+1 713 555 0142',
      stage: 'demo',
      dealValue: 99,
      nextFollowUp: iso(2, 15),
      activity: [
        act('note', 'Added to pipeline', 9),
        act('email', 'Cold email sent', 8),
        act('reply', 'Asked for pricing', 5),
        act('demo', 'Zoom demo booked', 3)
      ]
    },
    {
      businessName: 'Lumiere Skin Studio',
      ownerName: 'Chloe',
      nicheId: 'medspa',
      city: 'Toronto',
      country: 'Canada',
      currencyCode: 'CAD',
      rating: 4.7,
      instagram: 'lumiereskin.to',
      stage: 'won',
      dealValue: 79,
      activity: [
        act('note', 'Added to pipeline', 20),
        act('dm', 'Instagram DM sent', 18),
        act('demo', 'Loom demo watched', 14),
        act('won', 'Signed Growth plan — $79/mo', 10)
      ]
    },
    {
      businessName: 'Liffey Dental Care',
      ownerName: 'Aoife',
      nicheId: 'dental',
      city: 'Dublin',
      country: 'Ireland',
      currencyCode: 'EUR',
      rating: 4.4,
      email: 'info@liffeydental.example',
      stage: 'lost',
      dealValue: 99,
      activity: [act('note', 'Added to pipeline', 15), act('email', 'Cold email sent', 14), act('lost', 'Already on Podium contract', 7)]
    },
    {
      businessName: 'Precision Auto Spa',
      ownerName: 'Ryan',
      nicheId: 'detailing',
      city: 'Calgary',
      country: 'Canada',
      currencyCode: 'CAD',
      rating: 4.6,
      instagram: 'precisionautospa',
      stage: 'new',
      dealValue: 79,
      activity: [act('note', 'Added to pipeline', 0)]
    },
    {
      businessName: 'Apex Roofing Co',
      ownerName: 'Dan',
      nicheId: 'homeservices',
      city: 'Denver',
      country: 'USA',
      currencyCode: 'USD',
      rating: 4.1,
      email: 'dan@apexroofing.example',
      stage: 'contacted',
      dealValue: 99,
      nextFollowUp: iso(1, 10),
      activity: [act('note', 'Added to pipeline', 3), act('email', 'Cold email sent', 1)]
    }
  ];

  const sampleViews = {
    'Glow Theory Aesthetics': [{ hoursAgo: 3, seconds: 252, device: 'iPhone', pages: ['overview', 'inbox', 'reviews'], actions: ['missed_call', 'chat'] }],
    'Shine Lab Detailing': [
      { hoursAgo: 50, seconds: 64, device: 'Android', pages: ['overview'], actions: [] },
      { hoursAgo: 20, seconds: 381, device: 'Desktop', pages: ['overview', 'inbox', 'bookings', 'reviews'], actions: ['instagram', 'chat', 'booking', 'review'] }
    ],
    'Cool Breeze HVAC': [{ hoursAgo: 80, seconds: 143, device: 'Desktop', pages: ['overview', 'inbox'], actions: ['roi'] }]
  };

  return base.map((p) => {
    const created = p.activity[0].at;
    const last = p.activity[p.activity.length - 1].at;
    const visits = (sampleViews[p.businessName] || []).map((v) => {
      const at = new Date(Date.now() - v.hoursAgo * 3600000).toISOString();
      return {
        id: uid('vis'),
        startedAt: at,
        lastSeenAt: new Date(Date.parse(at) + v.seconds * 1000).toISOString(),
        seconds: v.seconds,
        device: v.device,
        pages: v.pages,
        actions: v.actions
      };
    });
    const viewActivity = visits.map((v) => ({ id: uid('pa'), type: 'viewed', visitId: v.id, text: visitText(v), at: v.startedAt }));
    const activity = [...p.activity, ...viewActivity].sort((a, b) => new Date(a.at) - new Date(b.at));
    return {
      id: uid('pr'),
      trackId: trackId(),
      views: visits.length,
      lastViewedAt: visits.length ? visits[visits.length - 1].lastSeenAt : null,
      visits: [...visits].reverse(),
      ownerName: '',
      country: '',
      email: '',
      instagram: '',
      phone: '',
      website: '',
      notes: '',
      nextFollowUp: null,
      lastContactedAt: p.activity.some((a) => ['dm', 'email', 'call'].includes(a.type)) ? last : null,
      ...p,
      activity: activity.reverse(),
      createdAt: created,
      updatedAt: activity[0].at
    };
  });
}

let seeding = null;

async function load() {
  if (!(await backend.isSeeded())) {
    if (!seeding) {
      seeding = (async () => {
        await backend.insertMany(seed());
        await backend.markSeeded();
      })().finally(() => {
        seeding = null;
      });
    }
    await seeding;
  }
  const all = await backend.all();
  const missing = all.filter((p) => !p.trackId);
  for (const p of missing) {
    p.trackId = trackId();
    p.views = p.views || 0;
    p.visits = p.visits || [];
    await backend.put(p);
  }
  return all;
}

async function list() {
  return (await load()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function get(id) {
  await load();
  return backend.get(id);
}

async function findDuplicate(value, exceptId, pool) {
  const email = (value.email || '').toLowerCase();
  const ig = (value.instagram || '').toLowerCase();
  const nameKey = `${(value.businessName || '').toLowerCase()}|${(value.city || '').toLowerCase()}`;
  return (pool || (await load())).find((p) => {
    if (p.id === exceptId) return false;
    if (email && p.email && p.email.toLowerCase() === email) return true;
    if (ig && p.instagram && p.instagram.toLowerCase() === ig) return true;
    return `${p.businessName.toLowerCase()}|${p.city.toLowerCase()}` === nameKey;
  });
}

async function create(value) {
  const now = new Date().toISOString();
  const prospect = {
    id: uid('pr'),
    ownerName: '',
    country: '',
    email: '',
    instagram: '',
    phone: '',
    website: '',
    notes: '',
    rating: null,
    dealValue: 79,
    nextFollowUp: null,
    lastContactedAt: null,
    ...value,
    ...freshTracking(),
    activity: [{ id: uid('pa'), type: 'note', text: 'Added to pipeline', at: now }],
    createdAt: now,
    updatedAt: now
  };
  if (prospect.dealValue === null) prospect.dealValue = 79;
  await load();
  await backend.insertMany([prospect]);
  return prospect;
}

async function createMany(values) {
  const now = new Date().toISOString();
  await load();
  const created = values.map((value) => ({
    id: uid('pr'),
    ownerName: '',
    country: '',
    email: '',
    instagram: '',
    phone: '',
    website: '',
    notes: '',
    rating: null,
    nextFollowUp: null,
    lastContactedAt: null,
    stage: 'new',
    ...value,
    dealValue: value.dealValue ?? 79,
    ...freshTracking(),
    activity: [{ id: uid('pa'), type: 'note', text: 'Imported from CSV', at: now }],
    createdAt: now,
    updatedAt: now
  }));
  await backend.insertMany(created);
  return created;
}

async function update(id, value) {
  const p = await get(id);
  if (!p) return null;
  const now = new Date().toISOString();
  if (value.stage && value.stage !== p.stage) {
    p.activity.unshift({ id: uid('pa'), type: 'note', text: `Moved to ${stageLabels[value.stage]}`, at: now });
  }
  Object.assign(p, value, { updatedAt: now });
  await backend.put(p);
  return p;
}

async function remove(id) {
  await load();
  return backend.remove(id);
}

const stageForType = { reply: 'replied', demo: 'demo', won: 'won', lost: 'lost' };
const defaultText = {
  dm: 'Instagram DM sent',
  email: 'Cold email sent',
  call: 'Call made',
  reply: 'Prospect replied',
  demo: 'Demo booked',
  won: 'Deal won',
  lost: 'Marked as lost',
  branded: 'Demo branded for this prospect'
};
const order = ['new', 'contacted', 'replied', 'demo', 'won'];

async function addActivity(id, { type, text, advanceTo, followUpDays }) {
  const p = await get(id);
  if (!p) return null;
  const now = new Date();
  p.activity.unshift({ id: uid('pa'), type, text: text || defaultText[type] || 'Note', at: now.toISOString() });

  if (['dm', 'email', 'call'].includes(type)) {
    p.lastContactedAt = now.toISOString();
    if (p.stage === 'new') p.stage = 'contacted';
  }
  const target = advanceTo || stageForType[type];
  if (target && target !== p.stage) {
    const forward = order.indexOf(target) > order.indexOf(p.stage);
    if (forward || target === 'lost' || target === 'won' || advanceTo) p.stage = target;
  }
  if (followUpDays !== undefined && followUpDays !== null && followUpDays !== '') {
    const d = new Date(now.getTime() + Number(followUpDays) * DAY);
    d.setHours(10, 0, 0, 0);
    p.nextFollowUp = d.toISOString();
  }
  if (p.stage === 'won' || p.stage === 'lost') p.nextFollowUp = null;
  p.activity = p.activity.slice(0, 200);
  p.updatedAt = now.toISOString();
  await backend.put(p);
  return p;
}

const PAGES = Object.keys(PAGE_LABELS);
const ACTIONS = Object.keys(ACTION_LABELS);
const MAX_VISIT_SECONDS = 3 * 3600;

async function recordView(ref, visitId, { type, page, action, device }) {
  const p = (await load()).find((x) => x.trackId === ref);
  if (!p) return false;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  p.visits = p.visits || [];
  let visit = p.visits.find((v) => v.id === visitId);

  if (!visit) {
    if (type === 'ping') return true;
    visit = { id: visitId, startedAt: nowIso, lastSeenAt: nowIso, seconds: 0, device, pages: [], actions: [] };
    p.visits.unshift(visit);
    p.visits = p.visits.slice(0, 30);
    p.views = (p.views || 0) + 1;
    p.activity.unshift({ id: uid('pa'), type: 'viewed', visitId, text: '', at: nowIso });
  } else {
    const gap = Math.max(0, (now - Date.parse(visit.lastSeenAt)) / 1000);
    visit.seconds = Math.min(MAX_VISIT_SECONDS, visit.seconds + Math.min(gap, 30));
    visit.lastSeenAt = nowIso;
  }

  if (PAGES.includes(page) && !visit.pages.includes(page)) visit.pages.push(page);
  if (ACTIONS.includes(action) && !visit.actions.includes(action)) visit.actions.push(action);

  const entry = p.activity.find((a) => a.visitId === visitId);
  if (entry) entry.text = visitText(visit);
  p.activity = p.activity.slice(0, 200);
  p.lastViewedAt = nowIso;
  p.updatedAt = nowIso;
  await backend.put(p);
  return true;
}

async function reset() {
  await backend.replaceAll(seed());
  await backend.markSeeded();
  return list();
}

module.exports = {
  list,
  get,
  create,
  createMany,
  update,
  remove,
  addActivity,
  findDuplicate,
  recordView,
  reset,
  backend,
  PAGES,
  ACTIONS
};
