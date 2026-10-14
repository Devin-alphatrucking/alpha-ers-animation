const niches = {
  medspa: {
    id: 'medspa',
    label: 'MedSpa & Aesthetics',
    shortLabel: 'MedSpa',
    icon: 'sparkles',
    defaultBiz: 'Miami Glow MedSpa',
    ownerFirstName: 'Sofia',
    ownerTitle: 'Owner',
    city: 'Miami',
    region: 'FL',
    country: 'USA',
    currency: '$',
    currencyCode: 'USD',
    rating: 4.6,
    reviewCount: 187,
    tagline: 'Injectables, skin & laser — booked, not chasing DMs',
    industryPhrase: 'medspa',
    competitorName: 'the medspa two blocks down',
    googleQuery: 'Miami Glow MedSpa Miami FL',
    services: [
      { id: 'botox', name: 'Botox (per area)', duration: 30, price: 349, popular: true, category: 'Injectables' },
      { id: 'lip-filler', name: 'Lip Filler 1ml', duration: 45, price: 650, popular: true, category: 'Injectables' },
      { id: 'hydrafacial', name: 'Hydrafacial Signature', duration: 50, price: 199, popular: true, category: 'Skin' },
      { id: 'laser', name: 'Laser Hair Removal (small)', duration: 25, price: 149, popular: false, category: 'Laser' },
      { id: 'consult', name: 'New Patient Consult', duration: 20, price: 0, popular: false, category: 'Consult' }
    ],
    faqs: [
      { q: 'Do you take walk-ins?', a: 'We keep a few same-day openings. I can check the next 48 hours for you.' },
      { q: 'Is a consult required for first-time Botox?', a: 'Yes — a 20-minute consult is complimentary and we can often treat the same visit.' },
      { q: 'Do you require a deposit?', a: 'A $50 hold confirms the appointment. It applies to your service.' }
    ],
    aiPersona:
      'You are the after-hours AI receptionist for a luxury medspa. Be warm, concise, never medical-advice heavy. Qualify: service, preferred day, new vs returning. Offer to book.',
    keywords: {
      price: ['price', 'cost', 'how much', 'pricing', '$'],
      book: ['book', 'appointment', 'available', 'slot', 'tomorrow', 'today', 'this week'],
      botox: ['botox', 'wrinkle', 'units', 'forehead'],
      hydra: ['hydrafacial', 'facial', 'glow', 'skin'],
      filler: ['filler', 'lips', 'lip'],
      laser: ['laser', 'hair removal']
    },
    sampleCustomerNames: ['Ava Martinez', 'Jordan Lee', 'Priya Shah', 'Emma Collins', 'Mia Chen'],
    metrics: {
      missedCallsSaved: 41,
      leadsCaught: 68,
      bookingsFromAi: 29,
      reviewsGained: 18,
      ratingLift: 0.3,
      noShowsPrevented: 11,
      avgTicket: 312,
      competitorMonthly: 399
    }
  },
  dental: {
    id: 'dental',
    label: 'Dental & Orthodontics',
    shortLabel: 'Dental',
    icon: 'smile',
    defaultBiz: 'BrightSmile Dental',
    ownerFirstName: 'Daniel',
    ownerTitle: 'Practice Owner',
    city: 'Austin',
    region: 'TX',
    country: 'USA',
    currency: '$',
    currencyCode: 'USD',
    rating: 4.4,
    reviewCount: 142,
    tagline: 'New-patient consults booked while the chair is occupied',
    industryPhrase: 'dental practice',
    competitorName: 'the DSO clinic with a full-time receptionist',
    googleQuery: 'BrightSmile Dental Austin TX',
    services: [
      { id: 'whitening', name: 'Professional Whitening', duration: 60, price: 399, popular: true, category: 'Cosmetic' },
      { id: 'invisalign', name: 'Invisalign Consult', duration: 30, price: 0, popular: true, category: 'Ortho' },
      { id: 'cleaning', name: 'Hygiene Cleaning', duration: 50, price: 189, popular: true, category: 'General' },
      { id: 'implant', name: 'Implant Consult', duration: 40, price: 0, popular: false, category: 'Restorative' },
      { id: 'emergency', name: 'Emergency Exam', duration: 30, price: 149, popular: false, category: 'Urgent' }
    ],
    faqs: [
      { q: 'Do you accept new patients?', a: 'Yes — we have new-patient openings this week. Insurance cards can be uploaded after booking.' },
      { q: 'Is Invisalign consult free?', a: 'The consult is complimentary. We take scans in-office and review a treatment estimate the same visit.' },
      { q: 'Emergency tooth pain?', a: 'We hold two same-day emergency slots. Tell me the pain level and I will get you in.' }
    ],
    aiPersona:
      'You are the AI front desk for a private dental practice. Calm, professional, never diagnose. Qualify: new/returning, insurance mention optional, urgency, preferred time.',
    keywords: {
      price: ['price', 'cost', 'how much', 'insurance', 'pricing'],
      book: ['book', 'appointment', 'available', 'opening', 'this week'],
      whitening: ['whiten', 'whitening', 'stain', 'yellow'],
      invisalign: ['invisalign', 'aligner', 'braces', 'straight'],
      implant: ['implant', 'missing tooth'],
      emergency: ['pain', 'emergency', 'broken', 'hurt', 'swollen']
    },
    sampleCustomerNames: ['Chris Nguyen', 'Olivia Brooks', 'Marcus Hale', 'Sofia Reyes', 'Liam Patel'],
    metrics: {
      missedCallsSaved: 36,
      leadsCaught: 54,
      bookingsFromAi: 24,
      reviewsGained: 15,
      ratingLift: 0.4,
      noShowsPrevented: 14,
      avgTicket: 410,
      competitorMonthly: 399
    }
  },
  detailing: {
    id: 'detailing',
    label: 'Auto Detailing & Ceramic',
    shortLabel: 'Detailing',
    icon: 'car',
    defaultBiz: 'Apex Auto Spa',
    ownerFirstName: 'Marcus',
    ownerTitle: 'Owner',
    city: 'Dallas',
    region: 'TX',
    country: 'USA',
    currency: '$',
    currencyCode: 'USD',
    rating: 4.7,
    reviewCount: 263,
    tagline: 'Ceramic & PPF quotes answered in under 60 seconds',
    industryPhrase: 'auto spa',
    competitorName: 'the chain detailer running Google ads',
    googleQuery: 'Apex Auto Spa Dallas TX',
    services: [
      { id: 'interior', name: 'Full Interior Detail', duration: 180, price: 249, popular: true, category: 'Detail' },
      { id: 'ceramic', name: '5-Year Ceramic Coating', duration: 480, price: 1299, popular: true, category: 'Protection' },
      { id: 'ppf', name: 'Partial PPF (hood + bumper)', duration: 360, price: 1899, popular: false, category: 'Protection' },
      { id: 'maintenance', name: 'Maintenance Wash + Wipe', duration: 60, price: 89, popular: true, category: 'Care' },
      { id: 'quote', name: 'In-Person Quote / Drop-off', duration: 20, price: 0, popular: false, category: 'Quote' }
    ],
    faqs: [
      { q: 'How long does ceramic take?', a: 'A 5-year ceramic is typically a 1-day drop-off. We send photos before pickup.' },
      { q: 'Do you come to me?', a: 'Studio work is in-bay for coating quality. Maintenance washes can be mobile — tell me your ZIP.' },
      { q: 'Deposit?', a: 'Ceramic and PPF require a 20% deposit to lock the bay.' }
    ],
    aiPersona:
      'You are the AI booking concierge for a premium auto spa. Talk like a pro detailer: concise, confident. Qualify: vehicle type, service, drop-off day.',
    keywords: {
      price: ['price', 'cost', 'how much', 'quote', 'pricing'],
      book: ['book', 'appointment', 'available', 'drop', 'slot', 'this week'],
      ceramic: ['ceramic', 'coating', 'hydrophobic', 'swirl'],
      ppf: ['ppf', 'paint protection', 'film', 'rock chip'],
      interior: ['interior', 'pet hair', 'stain', 'seats', 'detail']
    },
    sampleCustomerNames: ['Tyler Brooks', 'Elena Vasquez', 'James Okonkwo', 'Hannah Kim', 'Ryan Foster'],
    metrics: {
      missedCallsSaved: 52,
      leadsCaught: 81,
      bookingsFromAi: 34,
      reviewsGained: 22,
      ratingLift: 0.2,
      noShowsPrevented: 9,
      avgTicket: 540,
      competitorMonthly: 299
    }
  },
  homeservices: {
    id: 'homeservices',
    label: 'HVAC, Plumbing & Roofing',
    shortLabel: 'Home Services',
    icon: 'home',
    defaultBiz: 'Summit Home Services',
    ownerFirstName: 'Jake',
    ownerTitle: 'Owner-Operator',
    city: 'Phoenix',
    region: 'AZ',
    country: 'USA',
    currency: '$',
    currencyCode: 'USD',
    rating: 4.5,
    reviewCount: 318,
    tagline: 'Missed-call text-back that books the diagnostic before the truck leaves',
    industryPhrase: 'home services company',
    competitorName: 'the national franchise with a call center',
    googleQuery: 'Summit Home Services Phoenix AZ',
    services: [
      { id: 'tuneup', name: 'AC Tune-up', duration: 75, price: 89, popular: true, category: 'HVAC' },
      { id: 'diagnostic', name: 'HVAC Diagnostic Visit', duration: 60, price: 129, popular: true, category: 'HVAC' },
      { id: 'leak', name: 'Emergency Leak Stop', duration: 90, price: 189, popular: true, category: 'Plumbing' },
      { id: 'roof', name: 'Roof Inspection', duration: 60, price: 149, popular: false, category: 'Roofing' },
      { id: 'estimate', name: 'On-site Estimate', duration: 45, price: 0, popular: false, category: 'Sales' }
    ],
    faqs: [
      { q: 'Do you do same-day emergency?', a: 'Yes — emergency leak and no-cool calls are prioritized. Share your ZIP and we will confirm the next window.' },
      { q: 'Is the diagnostic fee waived?', a: 'If you approve the repair the same visit, the $129 diagnostic is credited.' },
      { q: 'Are you licensed?', a: 'Licensed, bonded, and insured in Arizona. We text the tech name and ETA before arrival.' }
    ],
    aiPersona:
      'You are the dispatch AI for a licensed HVAC/plumbing/roofing company. Direct, trustworthy, ZIP-code first. Qualify: issue, ZIP, membership/warranty, access.',
    keywords: {
      price: ['price', 'cost', 'how much', 'quote', 'estimate'],
      book: ['book', 'schedule', 'today', 'tomorrow', 'available', 'come out'],
      ac: ['ac', 'air', 'cool', 'hvac', 'furnace', 'not cooling'],
      leak: ['leak', 'pipe', 'water', 'flood', 'drip'],
      roof: ['roof', 'shingle', 'leak roof', 'storm']
    },
    sampleCustomerNames: ['Brandon Cole', 'Melissa Grant', 'Andre Silva', 'Katie Nguyen', 'Paul Hendricks'],
    metrics: {
      missedCallsSaved: 67,
      leadsCaught: 94,
      bookingsFromAi: 41,
      reviewsGained: 27,
      ratingLift: 0.3,
      noShowsPrevented: 8,
      avgTicket: 385,
      competitorMonthly: 399
    }
  }
};

const currencies = {
  USD: { symbol: '$', code: 'USD', label: 'USD $' },
  GBP: { symbol: '£', code: 'GBP', label: 'GBP £' },
  AUD: { symbol: 'A$', code: 'AUD', label: 'AUD A$' },
  CAD: { symbol: 'C$', code: 'CAD', label: 'CAD C$' },
  EUR: { symbol: '€', code: 'EUR', label: 'EUR €' }
};

function listNiches() {
  return Object.values(niches).map((n) => ({
    id: n.id,
    label: n.label,
    shortLabel: n.shortLabel,
    defaultBiz: n.defaultBiz,
    city: n.city,
    region: n.region,
    country: n.country,
    currency: n.currency,
    currencyCode: n.currencyCode,
    rating: n.rating,
    tagline: n.tagline
  }));
}

module.exports = { niches, currencies, listNiches };
