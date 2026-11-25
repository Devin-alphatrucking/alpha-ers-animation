import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, PhoneMissed, X } from 'lucide-react';
import { formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import { trackAction } from '../lib/track';
import { LogoMark } from './Brand';

const EVENT = 'pl:tour';
const SEEN_KEY = 'pl_tour_seen_';
const PAD = 8;
const GAP = 14;
const CARD_W = 340;

export function startTour(id = 'demo') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

function demoSteps({ b, m, offer, navigate }) {
  const prices = ['starter', 'growth', 'premium'].map((id) => offer?.plans?.[id]?.price).filter(Boolean);
  const from = prices.length ? Math.min(...prices) : 49;
  const days = offer?.setupDays || 2;
  return [
    {
      title: `Welcome to ${b.name}'s AI front desk`,
      body: `This demo already uses your name, services and prices. The tour takes about a minute, or skip it and click around.`,
      intro: true
    },
    {
      route: '/',
      target: 'kpis',
      title: 'Your month at a glance',
      body: `Money the desk recovered from calls and DMs that would have gone unanswered, plus new reviews and no-shows stopped. The small lines show the last 7 days.`
    },
    {
      route: '/',
      target: 'live-desk',
      title: 'Watch it work in real time',
      body: `Every few seconds a call, Instagram DM or review gets handled for ${b.name}. None of it needs you.`
    },
    {
      route: '/',
      target: 'roi',
      title: 'Run your own numbers',
      body: 'Drag the sliders to match a normal week. It shows the extra revenue each month and how many days it takes to pay for itself.'
    },
    {
      route: '/inbox',
      target: 'inbox',
      title: 'One inbox for every channel',
      body: 'Instagram, missed calls, website chat and Google messages all land here, already answered in your voice.'
    },
    {
      route: '/inbox',
      target: 'phone',
      edge: 'top',
      title: 'Try it as a customer',
      body: `Press the button to fake a missed call to ${b.name}. Then type “how much?” and “yes book it” on the phone.`,
      action: { label: 'Simulate a missed call', icon: PhoneMissed, run: () => navigate('/inbox', { state: { simulate: Date.now() } }) }
    },
    {
      route: '/bookings',
      target: 'bookings',
      title: 'Bookings fill themselves',
      body: 'Every booking from text or Instagram lands here and reminders go out on their own. Press Complete and the client gets a review request.'
    },
    {
      route: '/reviews',
      target: 'review-funnel',
      title: 'More 5★ reviews on Google',
      body: 'Tap 5 stars and the client goes straight to Google. Tap 1 to 3 and the feedback comes privately to you instead.'
    },
    {
      route: '/pricing',
      target: 'plans',
      title: `Live for ${b.name} in ${days} days`,
      body: `Plans start at $${from}/mo, about ${formatMoney(Math.max(0, (m.competitorMonthly - from) * 12))} a year less than Podium. Pick one and we set everything up.`
    }
  ];
}

function ownerSteps() {
  return [
    {
      title: 'Your sales cockpit',
      body: 'Overview, Inbox, Bookings, Reviews and Plans are what prospects see. The tools in “Your sales” are only visible to you.',
      intro: true
    },
    {
      route: '/leads',
      target: 'lead-search',
      title: 'Find businesses to pitch',
      body: 'Search Google Maps by niche and city. Weak ratings, few reviews or no website get marked Hot. Add them to your pipeline in one click.'
    },
    {
      route: '/prospects',
      target: 'pipeline',
      title: 'Track every pitch',
      body: 'Drag cards between stages. When a prospect opens their demo or clicks Pay, they show up under “Ready to buy” with a follow-up for today.'
    },
    {
      route: '/outreach',
      target: 'pitch-picker',
      title: "Pick who you're pitching",
      body: 'The whole demo rebrands to their business, the scripts fill in their name, and every time they open it gets logged.'
    },
    {
      route: '/outreach',
      target: 'demo-link',
      title: 'Send the link or a video',
      body: 'Copy their personal demo link, or press Record pitch video to make a 40-second Reel with their name and prices.'
    },
    {
      target: 'search',
      desktop: true,
      title: 'Everything is one shortcut away',
      body: 'Press Ctrl K (⌘K on Mac) to jump to any page, simulate a missed call, copy the demo link or record a video.'
    },
    {
      target: 'offer',
      desktop: true,
      title: 'Set your prices and payment links',
      body: 'Your plans, setup fee and Razorpay or Stripe links live here. Prospects see them on the Plans page and in every script.'
    }
  ];
}

const TOURS = { demo: demoSteps, owner: ownerSteps };

function findTarget(name) {
  const el = document.querySelector(`[data-tour="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

function placeCard(hole, cardH, vw, vh, edge) {
  const w = Math.min(CARD_W, vw - 24);
  const clampX = (x) => Math.max(12, Math.min(x, vw - w - 12));
  const clampY = (y) => Math.max(12, Math.min(y, vh - cardH - 12));
  if (!hole) return { left: (vw - w) / 2, top: Math.max(12, (vh - cardH) / 2), w };
  if (hole.bottom + GAP + cardH < vh - 12) return { left: clampX(hole.left), top: hole.bottom + GAP, w };
  if (hole.top - GAP - cardH > 12) return { left: clampX(hole.left), top: hole.top - GAP - cardH, w };
  if (vw - hole.right - GAP > w + 12) return { left: hole.right + GAP, top: clampY(hole.top), w };
  if (hole.left - GAP > w + 12) return { left: hole.left - GAP - w, top: clampY(hole.top), w };
  return { left: clampX(hole.right - w - 12), top: edge === 'top' ? 12 : vh - cardH - 20, w };
}

export default function Tour() {
  const { state, owner, offer } = useDemo();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tourId, setTourId] = useState(null);
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState(null);
  const [searching, setSearching] = useState(false);
  const [cardH, setCardH] = useState(200);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const target = useRef(null);
  const card = useRef(null);

  const steps = useMemo(() => {
    if (!tourId) return [];
    const all = TOURS[tourId]({ b: state.business, m: state.metrics, offer, navigate });
    return all.filter((s) => !s.desktop || window.innerWidth >= 768);
  }, [tourId, state.business, state.metrics, offer, navigate]);
  const step = steps[index];

  const close = useCallback(
    (finished) => {
      if (tourId) window.localStorage.setItem(SEEN_KEY + tourId, '1');
      if (finished && tourId === 'demo') trackAction('tour_done');
      setTourId(null);
      setHole(null);
      target.current = null;
    },
    [tourId]
  );

  useEffect(() => {
    const onStart = (e) => {
      setTourId(TOURS[e.detail] ? e.detail : 'demo');
      setIndex(0);
    };
    window.addEventListener(EVENT, onStart);
    return () => window.removeEventListener(EVENT, onStart);
  }, []);

  useEffect(() => {
    if (owner || pathname !== '/' || window.localStorage.getItem(SEEN_KEY + 'demo')) return undefined;
    const id = window.setTimeout(() => startTour('demo'), 1400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  useEffect(() => {
    if (!step) return undefined;
    target.current = null;
    setHole(null);
    if (step.route && pathname !== step.route) navigate(step.route);
    if (!step.target) return undefined;
    setSearching(true);
    const started = Date.now();
    const id = window.setInterval(() => {
      const el = findTarget(step.target);
      if (el || Date.now() - started > 2500) {
        window.clearInterval(id);
        setSearching(false);
        if (!el) return;
        target.current = el;
        const tall = el.getBoundingClientRect().height > window.innerHeight * 0.7;
        el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'smooth' });
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, index, steps.length]);

  useEffect(() => {
    if (!tourId) return undefined;
    let raf;
    const tick = () => {
      const el = target.current;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        const next = {
          top: Math.max(4, r.top - PAD),
          left: Math.max(4, r.left - PAD),
          right: Math.min(window.innerWidth - 4, r.right + PAD),
          bottom: Math.min(window.innerHeight - 4, r.bottom + PAD)
        };
        setHole((h) =>
          h && Math.abs(h.top - next.top) < 0.5 && Math.abs(h.left - next.left) < 0.5 && Math.abs(h.right - next.right) < 0.5 && Math.abs(h.bottom - next.bottom) < 0.5
            ? h
            : next
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [tourId]);

  useLayoutEffect(() => {
    if (card.current) setCardH(card.current.offsetHeight);
  }, [index, tourId, vp.w]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) close(true);
    else setIndex((i) => i + 1);
  }, [index, steps.length, close]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!tourId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') return close(false);
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return undefined;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      }
      return undefined;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourId, next, back, close]);

  if (!tourId || !step) return null;

  const pos = placeCard(step.target ? hole : null, cardH, vp.w, vp.h, step.edge);
  const counted = steps.filter((s) => !s.intro);
  const stepNo = counted.indexOf(step) + 1;
  const last = index === steps.length - 1;
  const shade = 'rgba(13,14,16,0.52)';
  const Action = step.action?.icon;

  return (
    <div className="fixed inset-0 z-[65]" aria-live="polite">
      {hole ? (
        <>
          <div className="absolute inset-x-0 top-0" style={{ height: hole.top }} />
          <div className="absolute inset-x-0 bottom-0" style={{ top: hole.bottom }} />
          <div className="absolute left-0" style={{ top: hole.top, height: hole.bottom - hole.top, width: hole.left }} />
          <div className="absolute right-0" style={{ top: hole.top, height: hole.bottom - hole.top, left: hole.right }} />
          <div
            className="pointer-events-none absolute rounded-[14px]"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.right - hole.left,
              height: hole.bottom - hole.top,
              boxShadow: `0 0 0 2px rgba(240,86,29,0.85), 0 0 0 6px rgba(240,86,29,0.18), 0 0 0 9999px ${shade}`,
              transition: 'top .35s cubic-bezier(.2,.8,.2,1), left .35s cubic-bezier(.2,.8,.2,1), width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1)'
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 transition-colors" style={{ background: searching ? 'rgba(13,14,16,0.2)' : shade }} />
      )}

      <div
        ref={card}
        role="dialog"
        aria-label={step.title}
        className="absolute rounded-[14px] border border-line bg-paper shadow-pop"
        style={{
          left: pos.left,
          top: pos.top,
          width: pos.w,
          opacity: searching ? 0 : 1,
          transition: 'left .35s cubic-bezier(.2,.8,.2,1), top .35s cubic-bezier(.2,.8,.2,1), opacity .2s ease'
        }}
      >
        <div key={`${tourId}-${index}`} className="pl-pop p-4">
          {step.intro ? (
            <>
              <div className="flex items-center justify-between">
                <LogoMark size={30} />
                <button onClick={() => close(false)} aria-label="Close tour" className="grid h-7 w-7 place-items-center rounded-[7px] text-mute hover:bg-ink/[0.05] hover:text-ink">
                  <X size={15} />
                </button>
              </div>
              <p className="mt-4 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{step.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{step.body}</p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={next}
                  className="flex h-9 items-center gap-1.5 rounded-[8px] bg-ember px-3.5 text-[13px] font-semibold text-white shadow-btn transition hover:bg-emberDeep"
                >
                  Start the tour <ArrowRight size={14} />
                </button>
                <button onClick={() => close(false)} className="h-9 rounded-[8px] px-3 text-[13px] font-medium text-mute hover:bg-ink/[0.04] hover:text-ink">
                  Skip for now
                </button>
                <span className="ml-auto font-mono text-[10px] text-mute">{counted.length} steps</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                  Step {stepNo} of {counted.length}
                </p>
                <button onClick={() => close(false)} aria-label="Close tour" className="-mr-1 grid h-7 w-7 place-items-center rounded-[7px] text-mute hover:bg-ink/[0.05] hover:text-ink">
                  <X size={15} />
                </button>
              </div>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink">{step.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mute">{step.body}</p>
              {step.action ? (
                <button
                  onClick={step.action.run}
                  className="mt-3 flex h-8 items-center gap-1.5 rounded-[8px] bg-ember px-3 text-[12px] font-semibold text-white shadow-btn transition hover:bg-emberDeep"
                >
                  {Action ? <Action size={13} /> : null}
                  {step.action.label}
                </button>
              ) : null}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {counted.map((s, i) => (
                    <span key={s.title} className={`h-1 flex-1 rounded-full transition-colors ${i < stepNo ? 'bg-ember' : 'bg-ink/10'}`} />
                  ))}
                </div>
                <button
                  onClick={back}
                  aria-label="Previous step"
                  className="grid h-8 w-8 place-items-center rounded-[8px] border border-line text-ink/70 transition hover:border-lineStrong hover:text-ink"
                >
                  <ArrowLeft size={14} />
                </button>
                <button onClick={next} className="flex h-8 items-center gap-1.5 rounded-[8px] bg-ink px-3 text-[12px] font-semibold text-white transition hover:bg-inkSoft">
                  {last ? 'Finish' : 'Next'} {last ? null : <ArrowRight size={13} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
