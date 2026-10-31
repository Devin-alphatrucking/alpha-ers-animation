import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, Instagram, PhoneMissed, ShieldCheck, Star } from 'lucide-react';
import { formatMoney, timeAgo } from '../api';
import { gsap } from '../lib/motion';

const EXTRA_NAMES = ['Chloe R.', 'Marcus T.', 'Hannah W.', 'Diego P.', 'Olivia K.', 'Ethan B.', 'Grace L.', 'Noah S.'];
const DAYS = ['today', 'tomorrow', 'Thu', 'Fri', 'Sat'];
const TIMES = ['9:30 am', '11:00 am', '1:15 pm', '3:45 pm', '5:30 pm'];
const QUOTES = ['Booked over text in a minute.', 'So easy to get an appointment.', 'Replied instantly at 10 pm!', 'Best experience in town.'];

const KIND = {
  missed: { icon: PhoneMissed, tone: 'bg-emberSoft text-emberDeep' },
  dm: { icon: Instagram, tone: 'bg-[#F3EEFD] text-[#6D28D9]' },
  booked: { icon: CalendarCheck, tone: 'bg-pineSoft text-pine' },
  review: { icon: Star, tone: 'bg-[#FEF6E4] text-[#A16207]' },
  shield: { icon: ShieldCheck, tone: 'bg-ink/[0.05] text-ink' }
};

function makeEvent(i, business, names) {
  const pick = (arr, n = i) => arr[(n * 7 + 3) % arr.length];
  const svc = business.services.filter((s) => s.price > 0);
  const s = pick(svc, i + 2);
  const name = pick(names, i);
  const price = formatMoney(s.price, business.currency);
  const kinds = ['missed', 'booked', 'dm', 'review', 'booked', 'missed', 'shield', 'dm'];
  const kind = kinds[i % kinds.length];
  const base = { id: `live${i}`, kind, at: new Date().toISOString(), value: 0 };
  switch (kind) {
    case 'missed':
      return { ...base, title: `Missed call from ${name}`, detail: `Texted back in ${8 + (i % 6)}s · asked about ${s.name}` };
    case 'dm':
      return { ...base, title: `${name} asked “how much is ${s.name.split(' (')[0]}?”`, detail: `AI quoted ${price} on Instagram · slot offered ${pick(DAYS, i + 1)}` };
    case 'booked':
      return { ...base, title: `Booked ${s.name}`, detail: `${name} · ${pick(DAYS)} ${pick(TIMES, i + 3)}`, value: s.price };
    case 'review':
      return { ...base, title: 'New 5★ Google review', detail: `“${pick(QUOTES)}” · ${name}` };
    default:
      return { ...base, title: '2★ feedback kept private', detail: `${name} waited past their slot · sent to you, not Google` };
  }
}

export default function LiveFeed({ business, seed = [], names = [] }) {
  const pool = useMemo(() => [...new Set([...names, ...EXTRA_NAMES])], [names]);
  const [events, setEvents] = useState(() =>
    seed.slice(0, 5).map((a) => ({ id: a.id, kind: /review|★/i.test(a.text) ? 'review' : /missed/i.test(a.text) ? 'missed' : /book/i.test(a.text) ? 'booked' : 'dm', title: a.text, detail: '', at: a.at, value: 0 }))
  );
  const [today, setToday] = useState(0);
  const counter = useRef(0);
  const list = useRef(null);
  const totalRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      counter.current += 1;
      const ev = makeEvent(counter.current, business, pool);
      setEvents((list0) => [ev, ...list0].slice(0, 6));
      if (ev.value) setToday((t) => t + ev.value);
    };
    const first = window.setTimeout(tick, 1600);
    const id = window.setInterval(tick, reduce ? 12000 : 5200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [business, pool]);

  useEffect(() => {
    const el = list.current?.firstElementChild;
    if (el && events[0]?.id?.startsWith('live')) {
      gsap.fromTo(el, { opacity: 0, y: -10, backgroundColor: 'rgba(240,86,29,0.06)' }, { opacity: 1, y: 0, backgroundColor: 'rgba(240,86,29,0)', duration: 0.6, ease: 'power3.out' });
    }
  }, [events]);

  useEffect(() => {
    if (today && totalRef.current) gsap.fromTo(totalRef.current, { scale: 1.12, color: '#0A6B4E' }, { scale: 1, color: '#0D0E10', duration: 0.5 });
  }, [today]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] text-ink">
            <span className="h-2 w-2 rounded-full bg-moss text-moss live-dot" />
            Live desk
          </p>
          <p className="mt-0.5 text-[12px] text-mute">Every call, DM and review, handled as it happens</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-mute">Booked this session</p>
          <p ref={totalRef} className="tabular text-[15px] font-semibold text-ink">
            +{formatMoney(today, business.currency)}
          </p>
        </div>
      </div>
      <ul ref={list} className="flex-1 divide-y divide-line overflow-hidden">
        {events.map((e) => {
          const k = KIND[e.kind] || KIND.dm;
          const Icon = k.icon;
          return (
            <li key={e.id} className="flex gap-3 px-5 py-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] ${k.tone}`}>
                <Icon size={14} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[13px] font-medium text-ink">{e.title}</p>
                  <span className="shrink-0 font-mono text-[10px] text-mute">{e.id.startsWith('live') ? 'now' : timeAgo(e.at)}</span>
                </div>
                {e.detail ? <p className="mt-0.5 truncate text-[12px] text-mute">{e.detail}</p> : null}
              </div>
              {e.value ? (
                <span className="mt-0.5 shrink-0 rounded-[6px] bg-pineSoft px-1.5 py-0.5 font-mono text-[11px] font-medium text-pine">
                  +{formatMoney(e.value, business.currency)}
                </span>
              ) : (
                <span className="mt-1 shrink-0 rounded-[5px] border border-line px-1.5 font-mono text-[9px] font-medium uppercase tracking-wide text-mute">AI</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
