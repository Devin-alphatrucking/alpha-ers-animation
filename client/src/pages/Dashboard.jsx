import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ArrowUpRight, PhoneMissed, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import { trackAction } from '../lib/track';
import LiveFeed from '../components/LiveFeed';
import { Btn, Count, PageShell, Sparkline, Surface } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function Delta({ value, good = true, suffix = '%' }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 font-mono text-[11px] font-medium ${
        good ? 'bg-pineSoft text-pine' : 'bg-emberSoft text-emberDeep'
      }`}
    >
      <Icon size={11} strokeWidth={2.25} />
      {up ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

function ChartTip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-line bg-paper px-3 py-2 shadow-lift">
      <p className="font-mono text-[10px] uppercase tracking-wide text-mute">{label}</p>
      <p className="tabular text-[14px] font-semibold text-ink">{formatMoney(payload[0].value, currency)}</p>
    </div>
  );
}

export default function Dashboard() {
  const { state, owner, offer } = useDemo();
  const { business: b, metrics: m, weekly, funnel, activity, leads } = state;
  const planPrices = useMemo(() => {
    const list = ['starter', 'growth', 'premium'].map((id) => offer?.plans?.[id]?.price).filter(Boolean);
    return list.length ? list : [49, 79, 99];
  }, [offer]);
  const [leadsPerWeek, setLeadsPerWeek] = useState(18);
  const [closeRate, setCloseRate] = useState(35);
  const [ticket, setTicket] = useState(m.avgTicket);
  const [pickedPlan, setPlan] = useState(null);
  const plan = planPrices.includes(pickedPlan) ? pickedPlan : planPrices[Math.min(1, planPrices.length - 1)];
  const roiTracked = useRef(false);
  const touchRoi = () => {
    if (roiTracked.current) return;
    roiTracked.current = true;
    trackAction('roi');
  };

  const roi = useMemo(() => {
    const captured = leadsPerWeek * 4 * (closeRate / 100) * 0.45;
    const extraRevenue = Math.round(captured * ticket);
    const vsPodium = m.competitorMonthly - plan;
    const paybackDays = extraRevenue > 0 ? Math.max(1, Math.round((plan / extraRevenue) * 30)) : 30;
    return { extraRevenue, vsPodium, yearly: vsPodium * 12, paybackDays, captured: Math.round(captured) };
  }, [leadsPerWeek, closeRate, ticket, plan, m.competitorMonthly]);

  const weekTotal = weekly.reduce((s, d) => s + d.recovered, 0);
  const names = useMemo(() => leads.map((l) => l.name), [leads]);
  const kpis = [
    { label: 'Missed calls saved', value: m.missedCallsSaved, delta: 18, spark: weekly.map((d) => d.missedSaved), foot: `${m.aiResponseSecs}s average reply` },
    { label: 'New 5★ reviews', value: m.reviewsGained, prefix: '+', delta: 24, spark: weekly.map((d) => d.reviews), foot: `Rating lift +${m.ratingLift}★` },
    { label: 'No-shows stopped', value: m.noShowsPrevented, delta: -38, good: true, spark: weekly.map((d, i) => 4 - (i % 3)), foot: `${m.noShowRate}% no-show rate`, stroke: '#0A6B4E' }
  ];

  const sliders = [
    { label: 'Slow leads / week', value: leadsPerWeek, set: setLeadsPerWeek, min: 6, max: 40, step: 1, fmt: (v) => v },
    { label: 'Close rate if fast', value: closeRate, set: setCloseRate, min: 15, max: 60, step: 1, fmt: (v) => `${v}%` },
    { label: 'Average ticket', value: ticket, set: setTicket, min: 80, max: 1500, step: 10, fmt: (v) => formatMoney(v, b.currency) }
  ];

  return (
    <PageShell
      kicker={`${b.shortLabel} · ${b.city} · this month`}
      title={`${greeting()}, ${b.ownerFirstName}`}
      subtitle={`Here's what the desk did for ${b.name} while you were with clients. ${b.rating}★ from ${b.reviewCount} Google reviews.`}
      actions={
        <>
          <Btn as={Link} to="/inbox" state={{ simulate: Date.now() }} variant="primary">
            <PhoneMissed size={15} /> Run missed-call demo
          </Btn>
          {owner ? (
            <Btn as={Link} to="/outreach" variant="ghost">
              Open pitch kit
            </Btn>
          ) : (
            <Btn as={Link} to="/reviews" variant="ghost">
              <Star size={14} /> Review booster
            </Btn>
          )}
        </>
      }
    >
      <section className="grid gap-3 lg:grid-cols-12">
        <Surface className="grid overflow-hidden sm:grid-cols-2 lg:col-span-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="relative border-b border-line p-5 sm:col-span-2 lg:col-span-1 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium text-mute">Revenue recovered</p>
              <Delta value={31} />
            </div>
            <p className="mt-3 text-[2.6rem] font-semibold leading-none tracking-tightest text-ink">
              <Count prefix={b.currency} value={m.revenueRecovered} />
            </p>
            <p className="mt-2 text-[12px] text-mute">
              {m.bookingsFromAi} jobs booked by the desk · avg ticket {formatMoney(m.avgTicket, b.currency)}
            </p>
            <Sparkline data={weekly.map((d) => d.recovered)} className="mt-3" height={36} />
          </div>
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className={`p-5 ${i < kpis.length - 1 ? 'border-b border-line sm:border-b-0 lg:border-r' : ''} ${i === 0 ? 'sm:border-r' : ''} ${
                i === 1 ? 'border-b sm:border-b-0' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-mute">{k.label}</p>
                <Delta value={k.delta} good={k.good ?? k.delta > 0} />
              </div>
              <p className="mt-3 text-[1.9rem] font-semibold leading-none tracking-tightest text-ink">
                <Count prefix={k.prefix} value={k.value} />
              </p>
              <p className="mt-2 text-[12px] text-mute">{k.foot}</p>
              <Sparkline data={k.spark} stroke={k.stroke} className="mt-3" height={28} />
            </div>
          ))}
        </Surface>

        <Surface className="p-5 lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-mute">Last 7 days</p>
              <p className="mt-1 text-[1.5rem] font-semibold leading-none tracking-tightest text-ink">
                <Count prefix={b.currency} value={weekTotal} />
                <span className="ml-2 text-[13px] font-normal tracking-normal text-mute">recovered from slow replies</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              {m.captureRate}% capture rate
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F0561D" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#F0561D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ECECE9" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6A6F78', fontFamily: 'Geist Mono' }} axisLine={false} tickLine={false} dy={6} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6A6F78', fontFamily: 'Geist Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => (v >= 1000 ? `${b.currency}${(v / 1000).toFixed(1)}k` : `${b.currency}${v}`)}
                />
                <Tooltip content={<ChartTip currency={b.currency} />} cursor={{ stroke: '#0D0E10', strokeOpacity: 0.12, strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#F0561D"
                  fill="url(#rev)"
                  strokeWidth={2}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#F0561D', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface className="overflow-hidden lg:col-span-4 lg:row-span-2">
          <LiveFeed business={b} seed={activity} names={names} />
        </Surface>

        <Surface className="relative overflow-hidden border-night bg-night p-6 text-white lg:col-span-8">
          <div className="dot-grid-dark pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/50">ROI calculator</p>
                <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em]">What {b.name} gets back</h2>
              </div>
              <div className="flex rounded-[9px] bg-white/[0.07] p-[3px]">
                {planPrices.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPlan(p);
                      touchRoi();
                    }}
                    className={`h-7 rounded-[7px] px-3 font-mono text-[12px] transition ${
                      plan === p ? 'bg-white text-ink' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    ${p}/mo
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {sliders.map((s) => (
                <label key={s.label} className="block">
                  <span className="flex items-baseline justify-between text-[12px] text-white/60">
                    {s.label}
                    <span className="tabular font-mono text-[13px] font-medium text-white">{s.fmt(s.value)}</span>
                  </span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={(e) => {
                      s.set(Number(e.target.value));
                      touchRoi();
                    }}
                    style={{ background: `linear-gradient(90deg, #F0561D ${((s.value - s.min) / (s.max - s.min)) * 100}%, rgba(255,255,255,0.14) 0)` }}
                    className="mt-3 w-full"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-[10px] bg-white/10 sm:grid-cols-3">
              {[
                ['Extra monthly revenue', formatMoney(roi.extraRevenue, b.currency), true],
                ['Saved vs Podium / yr', formatMoney(roi.yearly, b.currency)],
                ['Pays for itself in', `${roi.paybackDays} days`]
              ].map(([label, value, accent]) => (
                <div key={label} className="bg-night p-4">
                  <p className="text-[11px] text-white/50">{label}</p>
                  <p className={`tabular mt-1 text-[1.6rem] font-semibold tracking-tightest ${accent ? 'text-emberTint' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>

            {!owner ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Btn as={Link} to="/pricing" variant="primary">
                  See plans for {b.name} <ArrowRight size={14} />
                </Btn>
                <span className="text-[12px] text-white/50">Live in {offer?.setupDays || 2} days · cancel anytime</span>
              </div>
            ) : null}
          </div>
        </Surface>

        <Surface className="p-5 lg:col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.01em] text-ink">Lead funnel</p>
              <p className="text-[12px] text-mute">From first message to a 5★ review, this month</p>
            </div>
            <Link to="/inbox" className="flex items-center gap-1 text-[12px] font-medium text-mute hover:text-ink">
              Open inbox <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {funnel.map((row, i) => {
              const max = funnel[0].value || 1;
              const prev = i ? funnel[i - 1].value : null;
              return (
                <div key={row.stage} className="rounded-[10px] border border-line p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-mute">{row.stage}</p>
                    {prev ? <span className="font-mono text-[10px] text-mute">{Math.round((row.value / prev) * 100)}%</span> : null}
                  </div>
                  <p className="tabular mt-2 text-[1.5rem] font-semibold leading-none tracking-tightest">{row.value}</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${Math.max(8, (row.value / max) * 100)}%`, opacity: 1 - i * 0.14 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      </section>
    </PageShell>
  );
}
