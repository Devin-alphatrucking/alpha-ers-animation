const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'prospects.json');
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

  return base.map((p) => {
    const created = p.activity[0].at;
    const last = p.activity[p.activity.length - 1].at;
    return {
      id: uid('pr'),
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
      activity: [...p.activity].reverse(),
      createdAt: created,
      updatedAt: last
    };
  });
}

function load() {
  if (!fs.existsSync(FILE)) return save(seed());
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(data) ? data : save(seed());
  } catch {
    return save(seed());
  }
}

function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
  return list;
}

function list() {
  return load().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function findDuplicate(value, exceptId) {
  const email = (value.email || '').toLowerCase();
  const ig = (value.instagram || '').toLowerCase();
  const nameKey = `${(value.businessName || '').toLowerCase()}|${(value.city || '').toLowerCase()}`;
  return load().find((p) => {
    if (p.id === exceptId) return false;
    if (email && p.email && p.email.toLowerCase() === email) return true;
    if (ig && p.instagram && p.instagram.toLowerCase() === ig) return true;
    return `${p.businessName.toLowerCase()}|${p.city.toLowerCase()}` === nameKey;
  });
}

function create(value) {
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
    activity: [{ id: uid('pa'), type: 'note', text: 'Added to pipeline', at: now }],
    createdAt: now,
    updatedAt: now
  };
  if (prospect.dealValue === null) prospect.dealValue = 79;
  const all = load();
  all.push(prospect);
  save(all);
  return prospect;
}

function createMany(values) {
  const now = new Date().toISOString();
  const all = load();
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
    activity: [{ id: uid('pa'), type: 'note', text: 'Imported from CSV', at: now }],
    createdAt: now,
    updatedAt: now
  }));
  save([...all, ...created]);
  return created;
}

function update(id, value) {
  const all = load();
  const p = all.find((x) => x.id === id);
  if (!p) return null;
  const now = new Date().toISOString();
  if (value.stage && value.stage !== p.stage) {
    p.activity.unshift({ id: uid('pa'), type: 'note', text: `Moved to ${stageLabels[value.stage]}`, at: now });
  }
  Object.assign(p, value, { updatedAt: now });
  save(all);
  return p;
}

function remove(id) {
  const all = load();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  save(next);
  return true;
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

function addActivity(id, { type, text, advanceTo, followUpDays }) {
  const all = load();
  const p = all.find((x) => x.id === id);
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
  p.updatedAt = now.toISOString();
  save(all);
  return p;
}

function reset() {
  return save(seed());
}

module.exports = { list, create, createMany, update, remove, addActivity, findDuplicate, reset };
