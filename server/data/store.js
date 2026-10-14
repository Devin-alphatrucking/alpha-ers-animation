const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { niches, currencies } = require('./nichePresets');

const DB_PATH = path.join(__dirname, 'db.json');

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(amount, symbol) {
  return `${symbol}${Number(amount).toLocaleString('en-US')}`;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function buildSeed(nicheId, overrides = {}) {
  const preset = niches[nicheId] || niches.medspa;
  const currencyCode = overrides.currencyCode || preset.currencyCode;
  const currencyMeta = currencies[currencyCode] || currencies.USD;
  const symbol = currencyMeta.symbol;
  const now = dayjs();
  const businessName = overrides.businessName || preset.defaultBiz;
  const city = overrides.city || preset.city;
  const rating = Number(overrides.rating || preset.rating);

  const leadTemplates = {
    medspa: [
      {
        channel: 'instagram',
        preview: 'Hi do you have Hydrafacial availability this week? Also how much?',
        messages: [
          { from: 'customer', text: 'Hi do you have Hydrafacial availability this week? Also how much?' },
          {
            from: 'ai',
            text: `Hi! Yes — Hydrafacial Signature is ${money(199, symbol)} / 50 min. We have Thu 2:30pm and Fri 11:00am at ${businessName}. Want me to hold one?`
          },
          { from: 'customer', text: 'Friday 11 works. First time.' },
          {
            from: 'ai',
            text: 'Locked Fri 11:00am. I sent a $50 hold link. Arrive 10 min early for the consult photos. See you then!'
          }
        ],
        status: 'booked',
        value: 199,
        service: 'Hydrafacial Signature'
      },
      {
        channel: 'sms',
        preview: 'Missed call · looking for lip filler pricing',
        messages: [
          {
            from: 'ai',
            text: `Hi, this is ${businessName} — sorry we missed your call. Are you looking to book injectables, skin, or laser?`
          },
          { from: 'customer', text: 'Lip filler, how much and do I need a consult?' },
          {
            from: 'ai',
            text: `Lip Filler 1ml is ${money(650, symbol)}. First-timers get a complimentary 20-min consult and we can often treat the same visit. Tomorrow 4:15pm is open.`
          }
        ],
        status: 'ai-handling',
        value: 650,
        service: 'Lip Filler 1ml'
      },
      {
        channel: 'web',
        preview: 'Botox for forehead + 11s, new in Miami',
        messages: [
          { from: 'customer', text: 'Botox for forehead + 11s, new in Miami. Weekend openings?' },
          {
            from: 'ai',
            text: `Welcome to ${city}! Botox is ${money(349, symbol)} per area. Sat 10:30am consult is free and we can treat after. Shall I book it?`
          }
        ],
        status: 'needs-human',
        value: 349,
        service: 'Botox (per area)'
      },
      {
        channel: 'google',
        preview: 'Laser hair underarms — package vs single?',
        messages: [
          { from: 'customer', text: 'Laser hair underarms — package vs single?' },
          {
            from: 'ai',
            text: `Single small area is ${money(149, symbol)}. A 6-session package is usually 20% less — I can quote exact after a 2-min consult. Tue 6pm is open.`
          }
        ],
        status: 'ai-handling',
        value: 149,
        service: 'Laser Hair Removal (small)'
      }
    ],
    dental: [
      {
        channel: 'instagram',
        preview: 'Do you do Invisalign? I hate my crowding',
        messages: [
          { from: 'customer', text: 'Do you do Invisalign? I hate my crowding' },
          {
            from: 'ai',
            text: `Yes — complimentary Invisalign consult at ${businessName}. We scan in-office. Thu 5:20pm or Sat 9:00am?`
          },
          { from: 'customer', text: 'Saturday 9' },
          { from: 'ai', text: 'Booked Sat 9:00am. I texted a new-patient form. Bring a photo ID.' }
        ],
        status: 'booked',
        value: 0,
        service: 'Invisalign Consult'
      },
      {
        channel: 'sms',
        preview: 'Missed call · tooth pain 7/10',
        messages: [
          {
            from: 'ai',
            text: `Hi, ${businessName} here — we missed your call. Are you in pain, or looking to schedule hygiene / cosmetic?`
          },
          { from: 'customer', text: 'Tooth pain 7/10 since last night' },
          {
            from: 'ai',
            text: `I flagged this as emergency. We have a same-day exam at 3:40pm (${money(149, symbol)}, credited if you treat today). Confirm and I’ll hold it.`
          }
        ],
        status: 'ai-handling',
        value: 149,
        service: 'Emergency Exam'
      },
      {
        channel: 'web',
        preview: 'Whitening before a wedding in 3 weeks',
        messages: [
          { from: 'customer', text: 'Whitening before a wedding in 3 weeks. How much?' },
          {
            from: 'ai',
            text: `Professional whitening is ${money(399, symbol)} / 60 min. We have two openings next week. Want the faster slot?`
          }
        ],
        status: 'needs-human',
        value: 399,
        service: 'Professional Whitening'
      },
      {
        channel: 'google',
        preview: 'New patient cleaning, PPO insurance',
        messages: [
          { from: 'customer', text: 'New patient cleaning, I have PPO. Next availability?' },
          {
            from: 'ai',
            text: `We are accepting new patients. Hygiene is typically ${money(189, symbol)} before insurance. Wed 8:30am is open — I can hold it while you upload insurance.`
          }
        ],
        status: 'ai-handling',
        value: 189,
        service: 'Hygiene Cleaning'
      }
    ],
    detailing: [
      {
        channel: 'instagram',
        preview: 'Ceramic for a 2024 Tesla Model Y, white',
        messages: [
          { from: 'customer', text: 'Ceramic for a 2024 Tesla Model Y, white. How much / how long?' },
          {
            from: 'ai',
            text: `5-year ceramic on a Model Y is ${money(1299, symbol)}, typically a 1-day drop-off at ${businessName}. Thursday bay is open. 20% deposit locks it.`
          },
          { from: 'customer', text: 'Thursday works. Can I drop at 8am?' },
          { from: 'ai', text: 'Locked. Drop 8:00–8:30am. I sent the deposit link and a paint-condition checklist.' }
        ],
        status: 'booked',
        value: 1299,
        service: '5-Year Ceramic Coating'
      },
      {
        channel: 'sms',
        preview: 'Missed call · pet hair interior',
        messages: [
          {
            from: 'ai',
            text: `Hey — ${businessName} missed your call. Interior, ceramic, or a maintenance wash?`
          },
          { from: 'customer', text: 'Full interior, two dogs, SUV' },
          {
            from: 'ai',
            text: `Full interior on an SUV is ${money(249, symbol)} / ~3 hrs. Tomorrow 11:00am is open. Drop-off or wait-on-site?`
          }
        ],
        status: 'ai-handling',
        value: 249,
        service: 'Full Interior Detail'
      },
      {
        channel: 'web',
        preview: 'PPF hood + bumper for F-150',
        messages: [
          { from: 'customer', text: 'PPF hood + bumper for an F-150. Quote?' },
          {
            from: 'ai',
            text: `Partial PPF (hood + bumper) starts at ${money(1899, symbol)}. Best accuracy is a 20-min in-person quote — Sat morning is open.`
          }
        ],
        status: 'needs-human',
        value: 1899,
        service: 'Partial PPF (hood + bumper)'
      },
      {
        channel: 'google',
        preview: 'Maintenance wash for a coated car',
        messages: [
          { from: 'customer', text: 'I already have ceramic. Maintenance wash price?' },
          {
            from: 'ai',
            text: `Maintenance wash + ceramic wipe is ${money(89, symbol)}. We have two express slots tomorrow afternoon.`
          }
        ],
        status: 'ai-handling',
        value: 89,
        service: 'Maintenance Wash + Wipe'
      }
    ],
    homeservices: [
      {
        channel: 'instagram',
        preview: 'AC not cooling, Phoenix 85018',
        messages: [
          { from: 'customer', text: 'AC not cooling, Phoenix 85018. Can someone come today?' },
          {
            from: 'ai',
            text: `Got it — no-cool in 85018. Diagnostic is ${money(129, symbol)} (credited if you approve repair). We have a 2–4pm window today. Confirm and I’ll dispatch.`
          },
          { from: 'customer', text: 'Yes 2-4' },
          {
            from: 'ai',
            text: 'Booked. Tech: Luis. I’ll text ETA 30 min before arrival. Gate code if you have one?'
          }
        ],
        status: 'booked',
        value: 129,
        service: 'HVAC Diagnostic Visit'
      },
      {
        channel: 'sms',
        preview: 'Missed call · water heater leak',
        messages: [
          {
            from: 'ai',
            text: `Hi, ${businessName} — we missed your call. HVAC, plumbing leak, or roof?`
          },
          { from: 'customer', text: 'Water heater leaking in the garage' },
          {
            from: 'ai',
            text: `Emergency leak stop is ${money(189, symbol)} trip + parts. I can get a tech to you in the next 90 minutes. What’s the ZIP?`
          }
        ],
        status: 'ai-handling',
        value: 189,
        service: 'Emergency Leak Stop'
      },
      {
        channel: 'web',
        preview: 'Roof inspection after last night’s storm',
        messages: [
          { from: 'customer', text: 'Roof inspection after last night’s storm. Insurance claim maybe.' },
          {
            from: 'ai',
            text: `Inspection is ${money(149, symbol)} and includes photos for insurance. Tomorrow 9:00am or 1:30pm in ${city}. Which window?`
          }
        ],
        status: 'needs-human',
        value: 149,
        service: 'Roof Inspection'
      },
      {
        channel: 'google',
        preview: 'AC tune-up before summer',
        messages: [
          { from: 'customer', text: 'AC tune-up before summer hits. Membership?' },
          {
            from: 'ai',
            text: `Tune-up is ${money(89, symbol)}. Members get priority and 15% off repairs — I can enroll you at the visit. Fri 10am is open.`
          }
        ],
        status: 'ai-handling',
        value: 89,
        service: 'AC Tune-up'
      }
    ]
  };

  const names = preset.sampleCustomerNames;
  const templates = leadTemplates[preset.id] || leadTemplates.medspa;

  const leads = templates.map((t, i) => {
    const created = now.subtract(i * 3 + 1, 'hour');
    return {
      id: uid('lead'),
      name: names[i],
      phone: `+1 (214) 555-01${20 + i}`,
      channel: t.channel,
      preview: t.preview,
      status: t.status,
      value: t.value,
      service: t.service,
      unread: t.status !== 'booked',
      createdAt: created.toISOString(),
      responseSecs: t.status === 'booked' ? 22 + i * 4 : 8 + i,
      messages: t.messages.map((m, mi) => ({
        id: uid('msg'),
        from: m.from,
        text: m.text,
        at: created.add(mi * 2, 'minute').toISOString()
      }))
    };
  });

  const statuses = ['confirmed', 'confirmed', 'checked-in', 'completed', 'no-show-protected'];
  const bookings = preset.services.slice(0, 5).map((service, i) => {
    const start = now.add(i - 1, 'day').hour(10 + i).minute(i % 2 === 0 ? 0 : 30).second(0);
    const status = statuses[i];
    return {
      id: uid('bkg'),
      customer: pick(names, i + 1),
      phone: `+1 (469) 555-04${10 + i}`,
      service: service.name,
      serviceId: service.id,
      price: service.price,
      duration: service.duration,
      start: start.toISOString(),
      status,
      deposit: service.price >= 400 ? Math.round(service.price * 0.2) : 0,
      reminders: status === 'no-show-protected' ? ['-24h', '-2h', 'confirm-yes'] : ['-24h', '-2h'],
      source: i % 2 === 0 ? 'AI text-back' : 'Instagram DM',
      notes: i === 2 ? 'VIP / returning' : ''
    };
  });

  const reviewPool = [
    {
      stars: 5,
      text: `Best experience I have had in ${city}. Booked over text in under a minute.`,
      platform: 'google',
      customer: names[0]
    },
    {
      stars: 5,
      text: 'Showed up exactly when the reminder said. Super easy to book.',
      platform: 'google',
      customer: names[1]
    },
    {
      stars: 4,
      text: 'Great result. Waiting room was a little busy but staff was kind.',
      platform: 'google',
      customer: names[2]
    }
  ];

  const reviews = reviewPool.map((r, i) => ({
    id: uid('rev'),
    ...r,
    createdAt: now.subtract(i + 1, 'day').toISOString(),
    source: 'review funnel',
    status: 'published'
  }));

  const privateFlags = [
    {
      id: uid('flag'),
      customer: names[3],
      stars: 2,
      reason: 'Waited 25 minutes past appointment',
      createdAt: now.subtract(5, 'hour').toISOString(),
      status: 'open',
      intercepted: true
    }
  ];

  const m = preset.metrics;
  const recovered =
    m.bookingsFromAi * m.avgTicket + m.noShowsPrevented * Math.round(m.avgTicket * 0.7);
  const reviewValue = m.reviewsGained * 180;

  const activity = [
    {
      id: uid('act'),
      type: 'booking',
      text: `AI booked ${leads[0].service} for ${leads[0].name}`,
      at: now.subtract(18, 'minute').toISOString()
    },
    {
      id: uid('act'),
      type: 'missed-call',
      text: `Missed call recovered — ${leads[1].name} replied in 14s`,
      at: now.subtract(1, 'hour').toISOString()
    },
    {
      id: uid('act'),
      type: 'review',
      text: `5★ Google review posted via funnel`,
      at: now.subtract(3, 'hour').toISOString()
    },
    {
      id: uid('act'),
      type: 'shield',
      text: `Negative Review Shield caught a 2★ before it went public`,
      at: now.subtract(5, 'hour').toISOString()
    },
    {
      id: uid('act'),
      type: 'noshow',
      text: `No-show protected: customer confirmed via SMS`,
      at: now.subtract(9, 'hour').toISOString()
    }
  ];

  return {
    business: {
      name: businessName,
      ownerFirstName: overrides.ownerFirstName || preset.ownerFirstName,
      ownerTitle: preset.ownerTitle,
      nicheId: preset.id,
      nicheLabel: preset.label,
      shortLabel: preset.shortLabel,
      city,
      region: overrides.region || preset.region,
      country: preset.country,
      currency: symbol,
      currencyCode,
      rating,
      reviewCount: preset.reviewCount,
      tagline: preset.tagline,
      industryPhrase: preset.industryPhrase,
      competitorName: preset.competitorName,
      googleQuery: `${businessName} ${city}`,
      services: preset.services,
      faqs: preset.faqs
    },
    metrics: {
      ...m,
      revenueRecovered: recovered,
      reviewValue,
      monthlySavingsVsPodium: m.competitorMonthly - 79,
      aiResponseSecs: 11,
      noShowRate: 4.2,
      captureRate: 91
    },
    funnel: [
      { stage: 'Inquiries', value: m.leadsCaught },
      { stage: 'AI replied < 60s', value: Math.round(m.leadsCaught * 0.94) },
      { stage: 'Qualified', value: Math.round(m.leadsCaught * 0.71) },
      { stage: 'Booked', value: m.bookingsFromAi },
      { stage: 'Showed + reviewed', value: m.reviewsGained }
    ],
    weekly: [0, 1, 2, 3, 4, 5, 6].map((d) => {
      const day = now.subtract(6 - d, 'day');
      return {
        day: day.format('dd'),
        recovered: Math.round(m.avgTicket * (2 + ((d * 3) % 5))),
        reviews: (d % 3) + 1,
        missedSaved: 3 + (d % 4)
      };
    }),
    leads,
    bookings,
    reviews,
    privateFlags,
    activity,
    reviewCampaigns: {
      sent: 46,
      opened: 39,
      fiveStarClicks: m.reviewsGained,
      intercepted: 3
    },
    simulator: {
      channel: 'sms',
      messages: []
    }
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function save(state) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  return state;
}

function getState() {
  const existing = load();
  if (existing && existing.business) return existing;
  return save(buildSeed('medspa'));
}

function reset(nicheId, overrides) {
  return save(buildSeed(nicheId || 'medspa', overrides || {}));
}

function personalize(payload) {
  const current = getState();
  const nicheId = payload.nicheId || current.business.nicheId;
  const next = buildSeed(nicheId, {
    businessName: payload.businessName || current.business.name,
    city: payload.city || current.business.city,
    currencyCode: payload.currencyCode || current.business.currencyCode,
    rating: payload.rating || current.business.rating,
    ownerFirstName: payload.ownerFirstName || current.business.ownerFirstName,
    region: payload.region
  });
  return save(next);
}

function updateState(mutator) {
  const state = getState();
  mutator(state);
  return save(state);
}

module.exports = {
  uid,
  getState,
  reset,
  personalize,
  updateState,
  buildSeed
};
