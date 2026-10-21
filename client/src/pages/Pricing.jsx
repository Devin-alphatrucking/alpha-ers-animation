import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarClock, Check, ChevronDown, Mail, MessageCircle, Settings2 } from 'lucide-react';
import { formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import { checkoutUrl, trackAction } from '../lib/track';
import OnboardingForm, { PLAN_NAMES } from '../components/OnboardingForm';
import { Badge, Btn, Drawer, PageShell, Surface } from '../components/ui';

const FEATURES = {
  starter: ['Missed-call text-back in 15 seconds', 'AI replies on your website chat', 'Booking link with reminders', 'Monthly results report'],
  growth: [
    'Everything in Starter',
    'Instagram & Facebook DM auto-replies',
    'Google review booster',
    'Negative review shield (1–3★ stay private)',
    'No-show reminders by text'
  ],
  premium: [
    'Everything in Growth',
    'AI trained on your full service menu',
    'Multiple staff calendars or locations',
    'Priority WhatsApp support',
    'Monthly 20-minute strategy call'
  ]
};

const FAQ = [
  ['Do I need to change my phone number?', 'No. Missed calls forward to the desk, which texts the caller back from a local number. Your number stays the same.'],
  ['What does the AI know about my business?', 'We load your services, prices, hours and booking rules during setup. Anything it is unsure about gets handed to you instead of guessed.'],
  ['Is there a contract?', 'No. Monthly plans can be cancelled anytime from the payment receipt or by sending us a message.'],
  ['Will it reply to bad reviews?', 'Unhappy customers are sent to a private feedback form first, so you can fix it before it ever reaches Google.'],
  ['How is this cheaper than Podium or Birdeye?', 'We run on a lean stack and set it up for you instead of selling seats, so you only pay for what a small team actually uses.']
];

function waLink(digits, text) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function Pricing() {
  const { state, offer, owner } = useDemo();
  const [params, setParams] = useSearchParams();
  const [reserve, setReserve] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const { business: b, metrics: m } = state;
  const plans = offer?.plans || {};
  const monthly = ['starter', 'growth', 'premium'].filter((id) => plans[id]);
  const days = offer?.setupDays || 2;
  const missingLinks = Object.entries(plans).filter(([, p]) => !p.hasLink).map(([id]) => PLAN_NAMES[id]);

  useEffect(() => {
    const id = params.get('reserve');
    if (id && plans[id]) {
      setReserve(id);
      const next = new URLSearchParams(params);
      next.delete('reserve');
      setParams(next, { replace: true });
    }
  }, [params, plans, setParams]);

  function openReserve(id) {
    trackAction('reserve');
    setReserve(id);
  }

  function planButton(id, variant = 'primary', label = '') {
    const p = plans[id];
    if (!p) return null;
    if (p.hasLink) {
      return (
        <Btn as="a" href={checkoutUrl(id)} variant={variant} size="lg" className="w-full">
          {label || `Start ${PLAN_NAMES[id]}`}
        </Btn>
      );
    }
    return (
      <Btn variant={variant} size="lg" className="w-full" onClick={() => openReserve(id)}>
        {label ? label.replace(/^Start/, 'Reserve') : `Reserve ${PLAN_NAMES[id]}`}
      </Btn>
    );
  }

  const waText = `Hi${offer?.founderName ? ` ${offer.founderName.split(' ')[0]}` : ''}, I just saw the ${offer?.brandName || 'PulseLocal AI'} demo for ${b.name}. Can we talk about getting it set up?`;

  return (
    <PageShell
      kicker={`Plans for ${b.name}`}
      title={`Get this running for ${b.name} in ${days} days`}
      subtitle={`In this demo the desk saved ${m.missedCallsSaved} missed calls and recovered ${formatMoney(m.revenueRecovered, b.currency)} in a month. Podium charges about $${m.competitorMonthly}/mo for less.`}
    >
      {owner && missingLinks.length ? (
        <div data-reveal className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ecd2c2] bg-[#fbefe7] px-4 py-3">
          <p className="text-[13px] text-ink">
            <span className="font-semibold">No payment link yet for {missingLinks.join(', ')}.</span>{' '}
            <span className="text-mute">Prospects will see “Reserve” and send you their details instead.</span>
          </p>
          <Btn as={Link} to="/settings" variant="ghost" size="sm">
            <Settings2 size={14} /> Add links
          </Btn>
        </div>
      ) : null}

      {offer?.videoEmbed ? (
        <Surface className="mb-4 overflow-hidden">
          <div className="relative aspect-video w-full bg-ink">
            <iframe
              src={offer.videoEmbed}
              title={`${offer.brandName} walkthrough`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </Surface>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-3">
        {monthly.map((id) => {
          const p = plans[id];
          const featured = id === 'growth';
          const saving = m.competitorMonthly - p.price;
          return (
            <Surface key={id} className={`flex flex-col p-6 ${featured ? 'border-pine ring-1 ring-pine/30' : ''}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[1.35rem]">{PLAN_NAMES[id]}</h2>
                {featured ? <Badge tone="pine">Most picked</Badge> : null}
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-[2.8rem] leading-none tracking-tight">${p.price}</span>
                <span className="text-[13px] text-mute">/month</span>
              </p>
              <p className="mt-1.5 text-[12px] text-moss">{saving > 0 ? `$${saving}/mo less than Podium` : 'No setup fee'}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {FEATURES[id].map((feat) => (
                  <li key={feat} className="flex gap-2 text-[13px] leading-snug">
                    <Check size={15} className="mt-0.5 shrink-0 text-pine" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {planButton(id, featured ? 'primary' : 'ghost')}
              </div>
            </Surface>
          );
        })}
      </section>

      {plans.setup ? (
        <Surface className="mt-3 grid gap-5 bg-ink p-6 text-paper md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8c8]">Done for you</p>
            <h2 className="mt-1 font-display text-[1.5rem] text-paper">
              ${plans.setup.price} once, then ${plans.setup.monthly}/mo
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/60">
              We build the whole Growth setup for {b.name}, train the AI on your prices, connect your Google profile and
              hand it over working. Lower monthly cost, one-time setup.
            </p>
          </div>
          <div className="md:w-56">
            {planButton('setup', 'primary', 'Start setup')}
          </div>
        </Surface>
      ) : null}

      <section className="mt-3 grid gap-3 lg:grid-cols-12">
        <Surface className="p-6 lg:col-span-7">
          <h2 className="font-display text-[1.35rem]">What happens after you pay</h2>
          <ol className="mt-5 space-y-4">
            {[
              ['Tell us about the business', 'A 2-minute form: services, prices, hours and your Google profile link.'],
              ['We set it up', `Missed-call text-back, DM replies, booking and the review funnel, configured for ${b.name}.`],
              [`Live in ${days} days`, 'You get a test call, a walkthrough video, and the desk starts catching leads.']
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-canvas font-mono text-[12px] font-semibold text-pine">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-semibold">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-mute">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Surface>

        <Surface className="p-6 lg:col-span-5">
          <h2 className="font-display text-[1.35rem]">Rather talk first?</h2>
          <p className="mt-1 text-[13px] text-mute">Ten minutes, no slides. We can personalise the AI live.</p>
          <div className="mt-5 space-y-2">
            {offer?.calendlyUrl ? (
              <Btn
                as="a"
                href={offer.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                variant="pine"
                size="lg"
                className="w-full"
                onClick={() => trackAction('book_call')}
              >
                <CalendarClock size={16} /> Book a 10-minute call
              </Btn>
            ) : null}
            {offer?.whatsapp ? (
              <Btn
                as="a"
                href={waLink(offer.whatsapp, waText)}
                target="_blank"
                rel="noreferrer"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => trackAction('whatsapp')}
              >
                <MessageCircle size={16} /> Message on WhatsApp
              </Btn>
            ) : null}
            {offer?.contactEmail ? (
              <Btn
                as="a"
                href={`mailto:${offer.contactEmail}?subject=${encodeURIComponent(`${offer.brandName} for ${b.name}`)}&body=${encodeURIComponent(waText)}`}
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => trackAction('email')}
              >
                <Mail size={16} /> Email us
              </Btn>
            ) : null}
            {!offer?.calendlyUrl && !offer?.whatsapp && !offer?.contactEmail ? (
              <Btn variant="pine" size="lg" className="w-full" onClick={() => openReserve(monthly.includes('growth') ? 'growth' : monthly[0] || 'setup')}>
                Send my details
              </Btn>
            ) : null}
          </div>
          {owner && !offer?.calendlyUrl && !offer?.whatsapp && !offer?.contactEmail ? (
            <p className="mt-3 text-[12px] text-mute">
              Add your Calendly, WhatsApp or email in <Link to="/settings" className="font-medium text-pine underline">Settings</Link>.
            </p>
          ) : null}
        </Surface>

        <Surface className="p-6 lg:col-span-12">
          <h2 className="font-display text-[1.35rem]">Questions owners ask</h2>
          <ul className="mt-3 divide-y divide-line">
            {FAQ.map(([q, a], i) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-[14px] font-medium"
                >
                  {q}
                  <ChevronDown size={16} className={`shrink-0 text-mute transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i ? <p className="max-w-3xl pb-4 text-[13px] leading-relaxed text-mute">{a}</p> : null}
              </li>
            ))}
          </ul>
        </Surface>
      </section>

      <Drawer
        open={Boolean(reserve)}
        onClose={() => setReserve(null)}
        kicker={reserve ? `${PLAN_NAMES[reserve]} plan` : ''}
        title={`Reserve a spot for ${b.name}`}
      >
        <p className="mb-5 text-[13px] leading-relaxed text-mute" data-stagger>
          Leave your details and we will send a secure payment link with your setup call. Nothing is charged today.
        </p>
        <div data-stagger>
          {reserve ? <OnboardingForm key={reserve} offer={offer} initialPlan={reserve} business={b} submitLabel="Reserve my spot" /> : null}
        </div>
      </Drawer>
    </PageShell>
  );
}
