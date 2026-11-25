import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronRight,
  Instagram,
  KanbanSquare,
  Keyboard,
  Megaphone,
  MessageSquareText,
  PhoneMissed,
  Play,
  SearchCheck,
  Star,
  X
} from 'lucide-react';
import { formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import { trackAction } from '../lib/track';
import { LogoMark } from './Brand';

const EVENT = 'pl:tour';
const DO_EVENT = 'pl:tour-do';
const SEEN_KEY = 'pl_tour_seen_';
const PAD = 8;
const GAP = 14;
const CARD_W = 360;

export function startTour(id = 'demo') {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

function runTourAction(action) {
  window.dispatchEvent(new CustomEvent(DO_EVENT, { detail: action }));
}

export function useTourActions(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const on = (e) => ref.current[e.detail]?.();
    window.addEventListener(DO_EVENT, on);
    return () => window.removeEventListener(DO_EVENT, on);
  }, []);
}

export const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));

function demoTour({ b, m, offer }) {
  const prices = ['starter', 'growth', 'premium'].map((id) => offer?.plans?.[id]?.price).filter(Boolean);
  const from = prices.length ? Math.min(...prices) : 49;
  const days = offer?.setupDays || 2;
  const yearly = formatMoney(Math.max(0, (m.competitorMonthly - from) * 12));
  return {
    intro: {
      title: `Welcome to ${b.name}'s AI front desk`,
      body: 'This demo already uses your name, services and prices. The tour runs each use case live in about 3 minutes. Start from the top or jump to the one you care about.'
    },
    chapters: [
      {
        title: 'Your results',
        icon: BarChart3,
        steps: [
          {
            route: '/',
            target: 'kpis',
            title: 'Your month at a glance',
            body: 'Money the desk recovered from calls and DMs that would have gone unanswered, plus new reviews and no-shows stopped. The small lines show the last 7 days.'
          },
          {
            route: '/',
            target: 'revenue-chart',
            title: 'Money that would have walked away',
            body: "Each day's revenue from leads the desk answered while you were busy. Those customers usually book with whoever replies first."
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
            body: 'Drag the sliders to match a normal week. It shows the extra revenue each month and how quickly it pays for itself.'
          },
          {
            route: '/',
            target: 'funnel',
            title: 'From first message to a 5★ review',
            body: 'How many leads got answered, qualified, booked and reviewed this month, without any staff time.'
          }
        ]
      },
      {
        title: 'Missed call → text back',
        icon: PhoneMissed,
        steps: [
          {
            route: '/inbox',
            target: 'phone',
            edge: 'top',
            title: "A customer calls and you can't pick up",
            body: "You're with a client, on a job, or it's after hours. Press the button and watch what happens on the customer's phone.",
            action: { label: 'Show me a missed call', do: 'missed' },
            done: 'Texted back in seconds, before they call the next business on Google.'
          },
          {
            route: '/inbox',
            target: 'thread',
            title: 'Every reply lands in your inbox',
            body: 'The same conversation shows up here. Desk replies are tagged, and you can take over any time by typing.'
          }
        ]
      },
      {
        title: 'Price question → booking',
        icon: MessageSquareText,
        steps: [
          {
            route: '/inbox',
            target: 'phone',
            edge: 'top',
            title: 'They ask the price',
            body: 'The desk answers from your real services and prices, then offers open times.',
            action: { label: 'Ask “how much?”', do: 'ask-price' },
            done: 'It quoted from your price list and offered times to book.'
          },
          {
            route: '/inbox',
            target: 'phone',
            edge: 'top',
            title: 'They say yes, and it books',
            body: 'No back-and-forth and no “let me check the calendar”. The desk confirms the slot and schedules reminders.',
            action: { label: 'Reply “yes book it”', do: 'book-it' },
            done: "Booked. It's in the calendar with reminders queued."
          }
        ]
      },
      {
        title: 'Instagram DMs',
        icon: Instagram,
        steps: [
          {
            route: '/inbox',
            target: 'phone',
            edge: 'top',
            title: 'Instagram DMs get answered too',
            body: '“How much?” in the DMs is the lead most businesses lose. The desk replies on Instagram in your voice.',
            action: { label: 'Show me an Instagram DM', do: 'instagram' },
            done: 'It quoted live pricing in the DM and offered a time.'
          },
          {
            route: '/inbox',
            target: 'channels',
            title: 'Every channel, one inbox',
            body: 'Filter by SMS, Instagram, website chat or Google. Nothing gets lost across five different apps.'
          }
        ]
      },
      {
        title: 'Bookings & no-shows',
        icon: CalendarCheck,
        steps: [
          {
            route: '/bookings',
            target: 'bookings',
            enter: 'close-booking-page',
            title: 'Your calendar fills itself',
            body: 'Bookings from texts, DMs and your booking page land here with status, value and deposits.'
          },
          {
            route: '/bookings',
            target: 'reminders',
            enter: 'close-booking-page',
            title: 'No-shows mostly disappear',
            body: 'Clients get a reminder 24 hours before and a “Reply YES” text 2 hours before. Slots nobody confirms get flagged.'
          },
          {
            route: '/bookings',
            target: 'booking-widget',
            enter: 'open-booking-page',
            title: 'A booking page for your Instagram bio',
            body: 'Customers pick a service and a time and book in 30 seconds, no account needed.',
            action: { label: 'Book a test appointment', do: 'demo-book' },
            done: 'Booked from the public page. It just landed in your calendar.'
          },
          {
            route: '/bookings',
            target: 'bookings',
            enter: 'close-booking-page',
            title: 'Finish a visit, get a review',
            body: 'Press Complete after the appointment and the client gets a review request by text.',
            action: { label: 'Complete the next visit', do: 'complete-first' },
            done: 'Marked complete. The review request is on its way.'
          }
        ]
      },
      {
        title: 'Google reviews',
        icon: Star,
        steps: [
          {
            route: '/reviews',
            target: 'review-stats',
            title: 'Review requests that get opened',
            body: 'Requests sent, opened, sent to Google and caught privately. Clients review far more often when asked by text right after the visit.'
          },
          {
            route: '/reviews',
            target: 'review-funnel',
            title: 'A happy client goes to Google',
            body: '4 or 5 stars: they get a ready-made draft and go straight to your Google listing.',
            action: { label: 'Show me a 5★ client', do: 'rate-5' },
            done: 'Sent to Google with a draft review ready to paste.'
          },
          {
            route: '/reviews',
            target: 'review-funnel',
            title: 'An unhappy client comes to you',
            body: '1 to 3 stars: the feedback comes to you privately, so you can fix it before it becomes a public 1★.',
            action: { label: 'Show me a 2★ client', do: 'rate-2' },
            done: 'Kept off Google and sent to you instead.'
          },
          {
            route: '/reviews',
            target: 'shield',
            title: 'Fix it before it goes public',
            body: 'Private feedback lands here. Reach out, make it right, then mark it resolved.'
          },
          {
            route: '/reviews',
            target: 'qr',
            title: 'Reviews from the counter too',
            body: 'Print this QR code for the front desk. It goes through the same funnel, never a raw Google link.'
          }
        ]
      },
      {
        title: 'Plans',
        icon: BadgeDollarSign,
        steps: [
          {
            route: '/pricing',
            target: 'plans',
            title: `Live for ${b.name} in ${days} days`,
            body: `Plans start at $${from}/mo, about ${yearly} a year less than Podium. Cancel anytime.`
          },
          {
            route: '/pricing',
            target: 'setup',
            title: 'Or we do everything for you',
            body: 'One-time setup: we build it, train the AI on your prices, connect Google and hand it over working.'
          },
          {
            route: '/pricing',
            target: 'after-pay',
            title: 'What happens next',
            body: `A 2-minute form, we set it up, and you're live in ${days} days with a test call and a walkthrough video.`
          }
        ]
      }
    ]
  };
}

function ownerTour() {
  return {
    intro: {
      title: 'Your sales cockpit',
      body: 'Overview, Inbox, Bookings, Reviews and Plans are what prospects see. The tools under “Your sales” are only visible to you.'
    },
    chapters: [
      {
        title: 'Find leads',
        icon: SearchCheck,
        steps: [
          {
            route: '/leads',
            target: 'lead-search',
            title: 'Find businesses to pitch',
            body: 'Search Google Maps by niche and city. Weak ratings, few reviews or no website get marked Hot. Add them to your pipeline in one click.'
          }
        ]
      },
      {
        title: 'Pipeline',
        icon: KanbanSquare,
        steps: [
          {
            route: '/prospects',
            target: 'pipeline',
            title: 'Track every pitch',
            body: 'Drag cards between stages. When a prospect opens their demo or clicks Pay, they show up under “Ready to buy” with a follow-up for today.'
          }
        ]
      },
      {
        title: 'Pitch',
        icon: Megaphone,
        steps: [
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
          }
        ]
      },
      {
        title: 'Shortcuts & offer',
        icon: Keyboard,
        steps: [
          {
            target: 'search',
            desktop: true,
            title: 'Everything is one shortcut away',
            body: 'Press Ctrl K (⌘K on Mac) to jump to any page, simulate a missed call, copy the demo link or start a tour.'
          },
          {
            target: 'offer',
            desktop: true,
            title: 'Set your prices and payment links',
            body: 'Your plans, setup fee and Razorpay or Stripe links live here. Prospects see them on the Plans page and in every script.'
          }
        ]
      }
    ]
  };
}

const TOURS = { demo: demoTour, owner: ownerTour };

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

function IconBtn({ label, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid h-7 w-7 place-items-center rounded-[7px] text-mute transition hover:bg-ink/[0.05] hover:text-ink ${className}`}
    >
      {children}
    </button>
  );
}

export default function Tour() {
  const { state, owner, offer } = useDemo();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tourId, setTourId] = useState(null);
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState(null);
  const [searching, setSearching] = useState(false);
  const [ran, setRan] = useState(false);
  const [cardH, setCardH] = useState(220);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const target = useRef(null);
  const card = useRef(null);

  const tour = useMemo(() => {
    if (!tourId) return null;
    const raw = TOURS[tourId]({ b: state.business, m: state.metrics, offer });
    const wide = window.innerWidth >= 768;
    const chapters = raw.chapters
      .map((c) => ({ ...c, steps: c.steps.filter((s) => !s.desktop || wide) }))
      .filter((c) => c.steps.length);
    const steps = [
      { ...raw.intro, intro: true },
      ...chapters.flatMap((c, ci) => c.steps.map((s, si) => ({ ...s, ci, si, chapterLen: c.steps.length })))
    ];
    return { chapters, steps };
  }, [tourId, state.business, state.metrics, offer]);
  const steps = tour?.steps || [];
  const step = steps[index];

  const close = useCallback(
    (finished) => {
      if (tourId) window.localStorage.setItem(SEEN_KEY + tourId, '1');
      if (finished && tourId === 'demo') trackAction('tour_done');
      runTourAction('close-booking-page');
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
    setRan(false);
    if (step.route && pathname !== step.route) navigate(step.route);
    if (!step.target) return undefined;
    setSearching(true);
    const started = Date.now();
    const id = window.setInterval(() => {
      const onRoute = !step.route || window.location.pathname === step.route;
      if (step.enter && onRoute) runTourAction(step.enter);
      const el = onRoute ? findTarget(step.target) : null;
      if (el || Date.now() - started > 3000) {
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
  }, [index, tourId, vp.w, ran]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) close(true);
    else setIndex((i) => i + 1);
  }, [index, steps.length, close]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const jumpToChapter = (ci) => setIndex(steps.findIndex((s) => s.ci === ci));
  const act = () => {
    runTourAction(step.action.do);
    setRan(true);
  };

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

  const { chapters } = tour;
  const pos = placeCard(step.target ? hole : null, cardH, vp.w, vp.h, step.edge);
  const chapter = step.intro ? null : chapters[step.ci];
  const ChapterIcon = chapter?.icon;
  const last = index === steps.length - 1;
  const shade = 'rgba(13,14,16,0.52)';
  const totalSteps = steps.length - 1;

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
                <IconBtn label="Close tour" onClick={() => close(false)}>
                  <X size={15} />
                </IconBtn>
              </div>
              <p className="mt-4 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{step.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{step.body}</p>
              <div className="mt-4 overflow-hidden rounded-[10px] border border-line">
                {chapters.map((c, ci) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.title}
                      onClick={() => jumpToChapter(ci)}
                      className="group flex w-full items-center gap-2.5 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-ink/[0.025]"
                    >
                      <span className="font-mono text-[10px] text-mute">{String(ci + 1).padStart(2, '0')}</span>
                      <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-emberSoft text-emberDeep">
                        <Icon size={13} />
                      </span>
                      <span className="flex-1 text-[13px] font-medium text-ink">{c.title}</span>
                      <ChevronRight size={14} className="text-mute transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={next}
                  className="flex h-9 items-center gap-1.5 rounded-[8px] bg-ember px-3.5 text-[13px] font-semibold text-white shadow-btn transition hover:bg-emberDeep"
                >
                  Start the full tour <ArrowRight size={14} />
                </button>
                <button onClick={() => close(false)} className="h-9 rounded-[8px] px-3 text-[13px] font-medium text-mute hover:bg-ink/[0.04] hover:text-ink">
                  Skip
                </button>
                <span className="ml-auto font-mono text-[10px] text-mute">{totalSteps} steps</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-emberSoft text-emberDeep">
                    <ChapterIcon size={11} />
                  </span>
                  <span className="truncate">
                    {step.ci + 1}/{chapters.length} · {chapter.title}
                  </span>
                </p>
                <IconBtn label="Close tour" onClick={() => close(false)} className="-mr-1 shrink-0">
                  <X size={15} />
                </IconBtn>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink">{step.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mute">{step.body}</p>
              {step.action ? (
                <div className="mt-3">
                  {ran && step.done ? (
                    <div className="flex items-start gap-2 rounded-[9px] bg-pineSoft px-3 py-2 text-[12px] font-medium leading-snug text-pine">
                      <Check size={14} className="mt-px shrink-0" strokeWidth={2.5} />
                      <span className="flex-1">{step.done}</span>
                      <button onClick={act} className="shrink-0 text-[11px] font-semibold underline-offset-2 hover:underline">
                        Again
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={act}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] bg-ember px-3 text-[12px] font-semibold text-white shadow-btn transition hover:bg-emberDeep"
                    >
                      <Play size={12} className="fill-current" />
                      {step.action.label}
                    </button>
                  )}
                </div>
              ) : null}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex flex-1 gap-1" title={`Step ${index} of ${totalSteps}`}>
                  {chapters.map((c, ci) => {
                    const fill = ci < step.ci ? 1 : ci === step.ci ? (step.si + 1) / step.chapterLen : 0;
                    return (
                      <button
                        key={c.title}
                        onClick={() => jumpToChapter(ci)}
                        aria-label={`Go to ${c.title}`}
                        className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10"
                      >
                        <span className="block h-full rounded-full bg-ember transition-[width] duration-300" style={{ width: `${fill * 100}%` }} />
                      </button>
                    );
                  })}
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
