import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BatteryFull,
  CalendarCheck,
  Check,
  ChevronLeft,
  EyeOff,
  Pause,
  PhoneOff,
  Play,
  RotateCcw,
  ShieldCheck,
  Signal,
  SkipBack,
  SkipForward,
  Star,
  Wifi
} from 'lucide-react';
import { formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import { LogoMark } from '../components/Brand';

const FORMATS = {
  reel: { label: 'Reel 9:16', w: 540, h: 960 },
  square: { label: 'Post 1:1', w: 760, h: 760 },
  wide: { label: 'Wide 16:9', w: 1280, h: 720 }
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function In({ lt, at, y = 14, className = '', style, children }) {
  const on = lt >= at;
  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: on ? 1 : 0,
        transform: on ? 'none' : `translateY(${y}px) scale(0.98)`,
        transition: 'opacity .45s ease, transform .6s cubic-bezier(.2,.8,.2,1)'
      }}
    >
      {children}
    </div>
  );
}

function Pop({ lt, at, instant, children }) {
  if (lt < at) return null;
  return <div className={instant ? '' : 'pl-pop'}>{children}</div>;
}

function Caption({ lt, parts, size }) {
  let i = 0;
  return (
    <h1 className="font-semibold text-ink" style={{ fontSize: size, lineHeight: 1.06, letterSpacing: '-0.035em' }}>
      {parts.map((p, pi) =>
        p.text.split(' ').map((word, wi) => {
          const at = 0.15 + i++ * 0.055;
          return (
            <span
              key={`${pi}-${wi}`}
              className={p.em ? 'text-ember' : ''}
              style={{
                display: 'inline-block',
                marginRight: '0.24em',
                opacity: lt >= at ? 1 : 0,
                transform: lt >= at ? 'none' : 'translateY(0.35em)',
                filter: lt >= at ? 'none' : 'blur(4px)',
                transition: 'opacity .4s ease, transform .55s cubic-bezier(.2,.8,.2,1), filter .4s ease'
              }}
            >
              {word}
            </span>
          );
        })
      )}
    </h1>
  );
}

function StatusBar({ dark }) {
  return (
    <div className={`flex items-center justify-between px-6 pt-3 text-[11px] font-semibold ${dark ? 'text-white' : 'text-ink'}`}>
      <span className="tabular">9:41</span>
      <span className="flex items-center gap-1">
        <Signal size={12} strokeWidth={2.5} />
        <Wifi size={12} strokeWidth={2.5} />
        <BatteryFull size={16} strokeWidth={2} />
      </span>
    </div>
  );
}

function Phone({ dark, children }) {
  return (
    <div className="relative h-[600px] w-[290px] rounded-[50px] bg-[#1B1C1F] p-[9px] shadow-[0_0_0_1.5px_#3A3B40,0_40px_80px_-24px_rgba(13,14,16,0.5),0_16px_32px_-16px_rgba(13,14,16,0.35)]">
      <span className="absolute -left-[3px] top-[118px] h-8 w-[3px] rounded-l bg-[#2A2B30]" />
      <span className="absolute -left-[3px] top-[166px] h-12 w-[3px] rounded-l bg-[#2A2B30]" />
      <span className="absolute -right-[3px] top-[148px] h-16 w-[3px] rounded-r bg-[#2A2B30]" />
      <div className={`relative h-full overflow-hidden rounded-[41px] ${dark ? 'bg-[#0D0E10]' : 'bg-white'}`}>
        <div className="absolute left-1/2 top-[9px] z-20 h-[25px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
        <div className="relative z-10">
          <StatusBar dark={dark} />
        </div>
        {children}
        <span className={`absolute bottom-2 left-1/2 z-20 h-[4px] w-[104px] -translate-x-1/2 rounded-full ${dark ? 'bg-white/80' : 'bg-black'}`} />
      </div>
    </div>
  );
}

function Bubble({ me, children }) {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-[17px] px-3 py-[7px] text-[12.5px] leading-[1.32] ${
          me ? 'rounded-br-[5px] bg-imessage text-white' : 'rounded-bl-[5px] bg-[#E9E9EB] text-black'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="typing flex gap-1 rounded-[17px] rounded-bl-[5px] bg-[#E9E9EB] px-3.5 py-3">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ThreadHeader({ name }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#F9F9F9] px-3 pb-2 pt-3">
      <ChevronLeft size={20} className="text-imessage" />
      <div className="flex flex-1 flex-col items-center">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-[#A5A9B1] to-[#868A93] text-[11px] font-semibold text-white">{initials}</span>
        <p className="mt-0.5 text-[10.5px] font-medium text-ink">{name}</p>
      </div>
      <span className="w-5" />
    </div>
  );
}

function Thread({ name, children }) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-[34px] flex flex-col">
      <ThreadHeader name={name} />
      <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-2.5 pb-3">{children}</div>
      <div className="px-2.5 pb-6">
        <div className="flex h-8 items-center rounded-full border border-[#D1D1D6] px-3 text-[12px] text-[#8E8E93]">iMessage</div>
      </div>
    </div>
  );
}

function buildScenes({ b, m, customer, svc, svc2, plan, setupDays }) {
  const price = formatMoney(svc.price, b.currency);
  const secs = m.aiResponseSecs || 9;
  const first = customer.split(' ')[0];
  const textBack = `Hi, it's ${b.name}. Sorry we missed your call! Looking to book, get a price, or something else? I can help right here.`;

  return [
    {
      id: 'intro',
      dur: 4.5,
      kicker: `Made for ${b.name}`,
      caption: [{ text: `${b.ownerFirstName}, here's an AI front desk built for` }, { text: `${b.name}.`, em: true }],
      sub: `${b.city} · ${b.rating}★ on Google · 40-second tour`,
      dark: true,
      screen: (lt) => (
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#2A2D34_0%,#0D0E10_60%)] text-white">
          <div className="mt-16 text-center">
            <p className="text-[12px] font-medium text-white/70">Tuesday, 12 March</p>
            <p className="tabular text-[64px] font-semibold leading-none tracking-[-0.04em]">9:41</p>
          </div>
          <In lt={lt} at={1.3} className="mx-3 mt-10 rounded-[18px] bg-white/[0.14] p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <LogoMark size={20} dark />
              <p className="flex-1 text-[11px] font-semibold">PulseLocal</p>
              <p className="text-[10px] text-white/60">now</p>
            </div>
            <p className="mt-1.5 text-[12px] font-semibold">Front desk is live</p>
            <p className="text-[12px] leading-snug text-white/80">
              Answering calls, DMs and reviews for {b.name}, 24/7.
            </p>
          </In>
          <In lt={lt} at={2.3} className="mx-3 mt-2 rounded-[18px] bg-white/[0.14] p-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-[#34C759]">
                <CalendarCheck size={12} />
              </span>
              <p className="flex-1 text-[11px] font-semibold">Calendar</p>
              <p className="text-[10px] text-white/60">2m ago</p>
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-white/80">
              New booking: {svc2.name}, Sat 2:30 pm
            </p>
          </In>
        </div>
      )
    },
    {
      id: 'missed',
      dur: 7,
      kicker: 'Missed calls',
      caption: [{ text: 'Every missed call gets a text back in' }, { text: `${secs} seconds.`, em: true }],
      sub: "Even when you're with a client, on a job, or closed.",
      dark: (lt) => lt < 3,
      screen: (lt) =>
        lt < 3 ? (
          <div className="absolute inset-0 flex flex-col items-center bg-[linear-gradient(180deg,#3B3F48_0%,#16181C_100%)] pt-20 text-white">
            <p className="text-[12px] text-white/60">{lt < 2.2 ? 'calling…' : 'No answer'}</p>
            <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">{b.name}</p>
            <span className={`mt-10 grid h-20 w-20 place-items-center rounded-full bg-white/10 text-[22px] font-semibold ${lt < 2.2 ? 'pl-ring' : ''}`}>
              {b.name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')}
            </span>
            <span className={`mt-auto mb-16 grid h-14 w-14 place-items-center rounded-full ${lt < 2.2 ? 'bg-[#FF3B30]' : 'bg-white/15'}`}>
              <PhoneOff size={22} />
            </span>
          </div>
        ) : (
          <Thread name={b.name}>
            <p className="pb-1 text-center text-[9.5px] font-medium text-[#8E8E93]">Missed call · Today 9:41</p>
            <Pop lt={lt} at={3.2}>
              <div className="mx-auto mb-1 flex w-fit items-center gap-1.5 rounded-full bg-pineSoft px-2.5 py-1 font-mono text-[10px] font-medium text-pine">
                <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                Texted back in 0:{String(Math.min(secs, Math.round(easeOut((lt - 3.2) / 1.4) * secs))).padStart(2, '0')}
              </div>
            </Pop>
            {lt >= 3.3 && lt < 4.6 ? <Typing /> : null}
            <Pop lt={lt} at={4.6}>
              <Bubble>{textBack}</Bubble>
            </Pop>
          </Thread>
        )
    },
    {
      id: 'book',
      dur: 9,
      kicker: 'Instant answers',
      caption: [{ text: 'It quotes your real prices and' }, { text: 'books the slot.', em: true }],
      sub: `${svc.name} at ${price}, straight from your menu.`,
      screen: (lt) => (
        <>
          <Thread name={b.name}>
            <Bubble>{textBack}</Bubble>
            <Pop lt={lt} at={0.6}>
              <Bubble me>How much is {svc.name.split(' (')[0].toLowerCase()}?</Bubble>
            </Pop>
            {lt >= 1.3 && lt < 2.6 ? <Typing /> : null}
            <Pop lt={lt} at={2.6}>
              <Bubble>
                {svc.name} is {price}. I can do Fri 11:00 am or Sat 2:30 pm. Want me to hold one?
              </Bubble>
            </Pop>
            <Pop lt={lt} at={4.1}>
              <Bubble me>Fri 11 please!</Bubble>
            </Pop>
            {lt >= 4.7 && lt < 5.7 ? <Typing /> : null}
            <Pop lt={lt} at={5.7}>
              <Bubble>You're booked, {first}! Fri 11:00 am. I'll text a reminder the day before.</Bubble>
            </Pop>
          </Thread>
          <In lt={lt} at={6.6} y={-28} className="absolute inset-x-2.5 top-[42px] z-30 rounded-[16px] border border-black/5 bg-white/95 p-3 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.3)] backdrop-blur">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-pineSoft text-pine">
                <CalendarCheck size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold text-ink">Booked into your calendar</p>
                <p className="truncate text-[11px] text-mute">
                  {customer} · Fri 11:00 am
                </p>
              </div>
              <span className="rounded-[6px] bg-pineSoft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-pine">+{price}</span>
            </div>
          </In>
        </>
      )
    },
    {
      id: 'reviews',
      dur: 7.5,
      kicker: 'Review booster',
      caption: [{ text: 'Happy clients go to' }, { text: 'Google.', em: true }, { text: 'Unhappy ones come to you.' }],
      sub: 'More 5★ reviews. Fewer public 1★s.',
      screen: (lt) => (
        <div className="absolute inset-x-0 bottom-0 top-[34px] bg-[#F5F5F3] px-4 pt-6">
          <div className="rounded-[18px] bg-white p-4 text-center shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] text-mute">{b.name}</p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-ink">How was your visit, {first}?</p>
            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => {
                const on = lt >= 0.8 + i * 0.22;
                return (
                  <Star
                    key={i}
                    size={26}
                    strokeWidth={1.5}
                    className={on ? 'fill-gold text-gold' : 'text-[#D1D1D6]'}
                    style={{ transform: on ? 'scale(1)' : 'scale(0.85)', transition: 'transform .3s cubic-bezier(.3,1.6,.5,1)' }}
                  />
                );
              })}
            </div>
            <div className={`mt-4 rounded-[10px] py-2.5 text-[12px] font-semibold text-white transition-colors ${lt >= 2.2 ? 'bg-ink' : 'bg-ink/30'}`}>
              {lt >= 2.6 ? 'Opening Google…' : 'Post my review'}
            </div>
          </div>
          <In lt={lt} at={3.0} className="mt-3 rounded-[16px] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#EAF1FE] text-[11px] font-bold text-[#1D4ED8]">G</span>
              <p className="flex-1 text-[11.5px] font-semibold text-ink">{customer}</p>
              <p className="text-[10px] text-mute">just now</p>
            </div>
            <p className="mt-1 text-[11px] tracking-[0.1em] text-gold">★★★★★</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink/80">Booked by text in a minute. Honestly the easiest appointment I've made.</p>
          </In>
          <In lt={lt} at={4.6} className="mt-2 rounded-[16px] border border-dashed border-lineStrong bg-white/60 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-white">
                <ShieldCheck size={13} />
              </span>
              <p className="flex-1 text-[11.5px] font-semibold text-ink">2★ from Mark D.</p>
              <span className="rounded-[5px] bg-pineSoft px-1.5 py-0.5 text-[9.5px] font-semibold text-pine">Kept private</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-mute">Sent to you to fix, not posted on Google.</p>
          </In>
        </div>
      )
    },
    {
      id: 'numbers',
      dur: 7,
      kicker: 'The numbers',
      caption: [{ text: "What it's worth to" }, { text: b.name, em: true }, { text: 'every month.' }],
      sub: `Estimated for a typical ${b.shortLabel.toLowerCase()} business in ${b.city}.`,
      panel: (lt) => {
        const count = (v, a) => Math.round(v * easeOut((lt - a) / 1.6));
        return (
          <div className="w-[400px] space-y-2.5">
            <In lt={lt} at={0.3} className="rounded-[18px] border border-line bg-paper p-5 shadow-lift">
              <p className="text-[12px] font-medium text-mute">Revenue recovered / month</p>
              <p className="tabular mt-1 text-[52px] font-semibold leading-none tracking-[-0.04em] text-ink">
                {formatMoney(count(m.revenueRecovered, 0.4), b.currency)}
              </p>
              <svg viewBox="0 0 300 40" className="mt-3 h-10 w-full" preserveAspectRatio="none">
                <path
                  d="M0 34 C40 30 60 26 90 27 S140 18 170 20 S230 8 300 4"
                  fill="none"
                  stroke="#F0561D"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - easeOut((lt - 0.5) / 1.8)}
                />
              </svg>
            </In>
            <div className="grid grid-cols-2 gap-2.5">
              <In lt={lt} at={0.7} className="rounded-[16px] border border-line bg-paper p-4 shadow-card">
                <p className="text-[11.5px] font-medium text-mute">Missed calls answered</p>
                <p className="tabular mt-1 text-[32px] font-semibold leading-none tracking-[-0.035em]">{count(m.missedCallsSaved, 0.8)}</p>
              </In>
              <In lt={lt} at={0.9} className="rounded-[16px] border border-line bg-paper p-4 shadow-card">
                <p className="text-[11.5px] font-medium text-mute">New 5★ reviews</p>
                <p className="tabular mt-1 text-[32px] font-semibold leading-none tracking-[-0.035em]">+{count(m.reviewsGained, 1.0)}</p>
              </In>
            </div>
            <In lt={lt} at={3.2} className="flex items-center justify-between rounded-[16px] bg-night p-4 text-white">
              <div>
                <p className="text-[11px] text-white/50">Podium charges</p>
                <p className="tabular text-[18px] font-semibold text-white/50 line-through decoration-ember decoration-2">${m.competitorMonthly}/mo</p>
              </div>
              <span className="font-mono text-[11px] text-white/40">vs</span>
              <div className="text-right">
                <p className="text-[11px] text-white/50">You pay</p>
                <p className="tabular text-[26px] font-semibold leading-none tracking-[-0.03em] text-emberTint">${plan}/mo</p>
              </div>
            </In>
          </div>
        );
      }
    },
    {
      id: 'cta',
      dur: 6,
      kicker: 'Your turn',
      caption: [{ text: 'Want this' }, { text: 'live', em: true }, { text: `for ${b.name}?` }],
      sub: "Reply DEMO and I'll send your private link.",
      panel: (lt) => (
        <In lt={lt} at={0.4} className="relative w-[400px] overflow-hidden rounded-[22px] bg-night p-6 text-white shadow-[0_40px_80px_-30px_rgba(13,14,16,0.6)]">
          <div className="dot-grid-dark pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} dark />
              <div>
                <p className="text-[15px] font-semibold tracking-[-0.02em]">PulseLocal</p>
                <p className="font-mono text-[10px] text-white/50">for {b.name}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {['Missed-call text-back', 'Instagram & website replies', 'Booking + reminders', 'Google review booster'].map((f, i) => (
                <In key={f} lt={lt} at={0.9 + i * 0.25} y={8} className="flex items-center gap-2.5 text-[14px]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ember">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </In>
              ))}
            </div>
            <In lt={lt} at={2.3} className="mt-6 flex items-center justify-between rounded-[12px] bg-white px-4 py-3 text-ink">
              <div>
                <p className="text-[11px] text-mute">Live in {setupDays} days</p>
                <p className="text-[15px] font-semibold tracking-[-0.01em]">Reply “DEMO”</p>
              </div>
              <span className="tabular rounded-[8px] bg-ember px-3 py-1.5 text-[13px] font-semibold text-white">${plan}/mo</span>
            </In>
          </div>
        </In>
      )
    }
  ];
}

export default function Present() {
  const { state, offer } = useDemo();
  const [params] = useSearchParams();
  const b = state.business;
  const m = state.metrics;
  const [format, setFormat] = useState(FORMATS[params.get('format')] ? params.get('format') : 'reel');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(params.get('autoplay') === '1');
  const [chrome, setChrome] = useState(true);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

  const scenes = useMemo(() => {
    const priced = b.services.filter((s) => s.price > 0);
    const svc = priced.find((s) => s.popular) || priced[0] || { name: 'a visit', price: 0 };
    const svc2 = priced.find((s) => s !== svc) || svc;
    const lead = state.leads.find((l) => l.name && l.name.includes(' '));
    const customer = lead ? `${lead.name.split(' ')[0]} ${lead.name.split(' ')[1][0]}.` : 'Chloe R.';
    const plan = offer?.plans?.growth?.price || 79;
    return buildScenes({ b, m, customer, svc, svc2, plan, setupDays: offer?.setupDays || 2 });
  }, [b, m, state.leads, offer]);

  const starts = useMemo(() => scenes.reduce((acc, s, i) => [...acc, i ? acc[i - 1] + scenes[i - 1].dur : 0], []), [scenes]);
  const total = starts[starts.length - 1] + scenes[scenes.length - 1].dur;
  let idx = scenes.length - 1;
  for (let i = 0; i < scenes.length; i += 1) {
    if (t < starts[i] + scenes[i].dur) {
      idx = i;
      break;
    }
  }
  const scene = scenes[idx];
  const lt = t - starts[idx];
  const f = FORMATS[format];
  const vertical = format === 'reel';

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((x) => Math.min(total, x + dt));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  useEffect(() => {
    if (t >= total) setPlaying(false);
  }, [t, total]);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.title = `${b.name} · PulseLocal`;
    return () => {
      document.title = 'PulseLocal AI';
    };
  }, [b.name]);

  const togglePlay = useCallback(() => {
    if (t >= total) {
      setT(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }, [t, total]);
  const jump = useCallback((i) => setT(starts[Math.max(0, Math.min(scenes.length - 1, i))] + 0.001), [starts, scenes.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') jump(idx + 1);
      else if (e.key === 'ArrowLeft') jump(lt > 1 ? idx : idx - 1);
      else if (e.key === 'r' || e.key === 'R') {
        setT(0);
        setPlaying(true);
      } else if (e.key === 'h' || e.key === 'H') setChrome((c) => !c);
      else if (e.key === '1') setFormat('reel');
      else if (e.key === '2') setFormat('square');
      else if (e.key === '3') setFormat('wide');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, jump, idx, lt]);

  const scale = Math.min((vp.w - 48) / f.w, (vp.h - (chrome ? 128 : 48)) / f.h);
  const dark = typeof scene.dark === 'function' ? scene.dark(lt) : scene.dark;
  const captionSize = vertical ? 38 : format === 'square' ? 36 : 52;

  const visual = scene.panel ? (
    <div key={scene.id} style={format === 'square' ? { transform: 'scale(0.82)' } : undefined}>
      {scene.panel(lt)}
    </div>
  ) : (
    <Phone dark={dark}>
      <div key={scene.id}>{scene.screen(lt)}</div>
    </Phone>
  );

  return (
    <div className={`flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-night ${chrome ? '' : 'cursor-none'}`}>
      <div style={{ width: f.w * scale, height: f.h * scale }}>
        <div
          className="relative overflow-hidden bg-canvas"
          style={{ width: f.w, height: f.h, transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: chrome ? 14 : 0 }}
        >
          <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_30%,black,transparent_75%)]" />

          <div className="absolute inset-x-5 top-4 z-30 flex gap-1">
            {scenes.map((s, i) => (
              <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10">
                <span
                  className="block h-full rounded-full bg-ink"
                  style={{ width: `${i < idx ? 100 : i > idx ? 0 : clamp01(lt / s.dur) * 100}%` }}
                />
              </span>
            ))}
          </div>
          <div className="absolute inset-x-6 top-9 z-30 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="text-[13px] font-semibold tracking-[-0.02em] text-ink">PulseLocal</span>
            </span>
            <span className="font-mono text-[11px] text-mute">for {b.name}</span>
          </div>

          <div
            key={`cap-${scene.id}`}
            className="absolute z-20"
            style={
              vertical
                ? { left: 32, right: 32, top: 96 }
                : { left: 56, width: format === 'square' ? 330 : 540, top: '50%', transform: 'translateY(-50%)' }
            }
          >
            <In lt={lt} at={0.05} y={6}>
              <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                <span className="h-1.5 w-1.5 bg-ember" />
                {scene.kicker}
              </p>
            </In>
            <Caption lt={lt} parts={scene.caption} size={captionSize} />
            <In lt={lt} at={0.9} y={8}>
              <p className="mt-4 text-[16px] leading-snug text-mute" style={{ fontSize: vertical ? 16 : 17 }}>
                {scene.sub}
              </p>
            </In>
          </div>

          <div
            className="pointer-events-none absolute z-0 rounded-full"
            style={{
              width: 520,
              height: 520,
              left: (vertical ? f.w / 2 : format === 'square' ? 560 : 900) - 260,
              top: vertical ? 400 : f.h / 2 - 220,
              background: 'radial-gradient(circle, rgba(240,86,29,0.16) 0%, rgba(240,86,29,0) 65%)'
            }}
          />
          <div
            className="absolute z-10 -translate-x-1/2"
            style={{
              left: vertical ? f.w / 2 : format === 'square' ? 572 : 900,
              top: vertical ? 330 : scene.panel ? '50%' : format === 'square' ? 130 : 84,
              transform: scene.panel && !vertical ? 'translate(-50%, -42%)' : undefined
            }}
          >
            {visual}
          </div>
        </div>
      </div>

      {chrome ? (
        <div className="flex flex-wrap items-center justify-center gap-1 rounded-[14px] border border-white/10 bg-white/[0.06] p-1.5 text-white backdrop-blur">
          <Link to="/" className="flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[13px] text-white/70 hover:bg-white/10 hover:text-white">
            <ArrowLeft size={14} /> App
          </Link>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button aria-label="Previous scene" onClick={() => jump(lt > 1 ? idx : idx - 1)} className="grid h-9 w-9 place-items-center rounded-[9px] text-white/70 hover:bg-white/10 hover:text-white">
            <SkipBack size={15} />
          </button>
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="grid h-9 w-11 place-items-center rounded-[9px] bg-white text-ink hover:bg-white/90"
          >
            {playing ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
          </button>
          <button aria-label="Next scene" onClick={() => jump(idx + 1)} className="grid h-9 w-9 place-items-center rounded-[9px] text-white/70 hover:bg-white/10 hover:text-white">
            <SkipForward size={15} />
          </button>
          <button
            aria-label="Restart"
            onClick={() => {
              setT(0);
              setPlaying(true);
            }}
            className="grid h-9 w-9 place-items-center rounded-[9px] text-white/70 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={15} />
          </button>
          <span className="tabular px-2 font-mono text-[12px] text-white/60">
            {clock(t)} / {clock(total)}
          </span>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <div className="flex rounded-[9px] bg-white/[0.06] p-[3px]">
            {Object.entries(FORMATS).map(([key, v]) => (
              <button
                key={key}
                onClick={() => setFormat(key)}
                className={`h-[30px] rounded-[7px] px-2.5 text-[12px] transition ${format === key ? 'bg-white text-ink' : 'text-white/60 hover:text-white'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setChrome(false)} className="flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[13px] text-white/70 hover:bg-white/10 hover:text-white">
            <EyeOff size={14} /> Clean view <span className="kbd border-white/20 bg-white/10 text-white/70">H</span>
          </button>
        </div>
      ) : null}
      {chrome && t === 0 && !playing ? (
        <p className="-mt-2 font-mono text-[11px] text-white/40">Start your screen recorder, press H for a clean view, then Space to play</p>
      ) : null}
    </div>
  );
}
