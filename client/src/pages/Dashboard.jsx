import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatMoney, timeAgo } from '../api';
import { useDemo } from '../context/DemoContext';
import { Btn, Count, PageShell, Surface } from '../components/ui';

export default function Dashboard() {
  const { state } = useDemo();
  const { business: b, metrics: m, weekly, funnel, activity } = state;
  const [leadsPerWeek, setLeadsPerWeek] = useState(18);
  const [closeRate, setCloseRate] = useState(35);
  const [ticket, setTicket] = useState(m.avgTicket);
  const [plan, setPlan] = useState(79);

  const roi = useMemo(() => {
    const captured = leadsPerWeek * 4 * (closeRate / 100) * 0.45;
    const extraRevenue = Math.round(captured * ticket);
    const vsPodium = m.competitorMonthly - plan;
    const paybackDays = extraRevenue > 0 ? Math.max(1, Math.round((plan / extraRevenue) * 30)) : 30;
    return { extraRevenue, vsPodium, yearly: vsPodium * 12, paybackDays, captured: Math.round(captured) };
  }, [leadsPerWeek, closeRate, ticket, plan, m.competitorMonthly]);

  return (
    <PageShell
      kicker="This month"
      title={b.name}
      subtitle={`${b.tagline} · ${b.city}${b.region ? `, ${b.region}` : ''} · ${b.rating}★ from ${b.reviewCount} Google reviews`}
      actions={
        <>
          <Btn as={Link} to="/inbox" variant="primary">
            Run missed-call demo
          </Btn>
          <Btn as={Link} to="/outreach" variant="ghost">
            Open pitch kit
          </Btn>
        </>
      }
    >
      <section className="grid gap-3 lg:grid-cols-12">
        <Surface className="p-6 lg:col-span-6">
          <p className="text-[12px] font-medium text-mute">Revenue recovered</p>
          <p className="mt-2 font-display text-[3.1rem] leading-none tracking-tight">
            <Count prefix={b.currency} value={m.revenueRecovered} />
          </p>
          <p className="mt-3 text-[13px] text-mute">
            {m.bookingsFromAi} jobs booked by the desk · avg ticket {formatMoney(m.avgTicket, b.currency)}
          </p>
        </Surface>
        <Surface className="p-5 lg:col-span-2">
          <p className="text-[12px] text-mute">Missed calls saved</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">
            <Count value={m.missedCallsSaved} />
          </p>
          <p className="mt-2 text-[12px] text-mute">{m.aiResponseSecs}s average reply</p>
        </Surface>
        <Surface className="p-5 lg:col-span-2">
          <p className="text-[12px] text-mute">New Google 5★</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">
            +<Count value={m.reviewsGained} />
          </p>
          <p className="mt-2 text-[12px] text-mute">Rating lift +{m.ratingLift}</p>
        </Surface>
        <Surface className="p-5 lg:col-span-2">
          <p className="text-[12px] text-mute">No-shows stopped</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">
            <Count value={m.noShowsPrevented} />
          </p>
          <p className="mt-2 text-[12px] text-mute">{m.noShowRate}% no-show rate</p>
        </Surface>

        <Surface className="p-5 lg:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[1.35rem]">Seven-day recovery</h2>
              <p className="text-[12px] text-mute">Updates when you run inbox simulations</p>
            </div>
            <span className="font-mono text-[11px] text-pine">{m.captureRate}% capture</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1C4A3E" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1C4A3E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ddd4c4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6F685C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6F685C' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={{ borderRadius: 6, border: '1px solid #DDD4C4', background: '#FBF8F1' }}
                  formatter={(val) => formatMoney(val, b.currency)}
                />
                <Area type="monotone" dataKey="recovered" stroke="#1C4A3E" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface className="p-5 lg:col-span-4">
          <h2 className="font-display text-[1.35rem]">Funnel</h2>
          <p className="mb-4 text-[12px] text-mute">{b.shortLabel} · this month</p>
          <ul className="space-y-3">
            {funnel.map((row, i) => {
              const max = funnel[0].value || 1;
              return (
                <li key={row.stage}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-mute">{row.stage}</span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  </div>
                  <div className="h-[3px] bg-canvas">
                    <div
                      className="h-full bg-pine"
                      style={{ width: `${Math.max(10, (row.value / max) * 100)}%`, opacity: 1 - i * 0.12 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Surface>

        <Surface className="bg-ink p-6 text-paper lg:col-span-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8c8]">ROI against Podium</p>
          <h2 className="mt-1 font-display text-[1.6rem] text-paper">What {b.name} gets back</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <label className="text-[13px] text-white/70">
              Slow leads / week
              <input
                type="range"
                min="6"
                max="40"
                value={leadsPerWeek}
                onChange={(e) => setLeadsPerWeek(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <span className="mt-1 block font-mono text-[12px] text-ember">{leadsPerWeek}</span>
            </label>
            <label className="text-[13px] text-white/70">
              Close rate if fast
              <input
                type="range"
                min="15"
                max="60"
                value={closeRate}
                onChange={(e) => setCloseRate(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <span className="mt-1 block font-mono text-[12px] text-ember">{closeRate}%</span>
            </label>
            <label className="text-[13px] text-white/70">
              Average ticket
              <input
                type="range"
                min="80"
                max="1500"
                step="10"
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value))}
                className="mt-3 w-full"
              />
              <span className="mt-1 block font-mono text-[12px] text-ember">{formatMoney(ticket, b.currency)}</span>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[49, 79, 99].map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`h-8 rounded-[5px] px-3 text-[12px] font-medium transition ${
                  plan === p ? 'bg-ember text-white' : 'bg-white/10 text-white/65 hover:bg-white/15'
                }`}
              >
                ${p}/mo
              </button>
            ))}
            <span className="h-8 px-3 leading-8 text-[12px] text-white/35">Podium ${m.competitorMonthly}/mo</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border border-white/10 p-4">
              <p className="text-[11px] text-white/45">Extra monthly revenue</p>
              <p className="font-display text-[1.8rem] text-[#e8c4b0]">{formatMoney(roi.extraRevenue, b.currency)}</p>
            </div>
            <div className="border border-white/10 p-4">
              <p className="text-[11px] text-white/45">Saved vs Podium / yr</p>
              <p className="font-display text-[1.8rem]">{formatMoney(roi.yearly, b.currency)}</p>
            </div>
            <div className="border border-white/10 p-4">
              <p className="text-[11px] text-white/45">Payback</p>
              <p className="font-display text-[1.8rem]">{roi.paybackDays} days</p>
            </div>
          </div>
        </Surface>

        <Surface className="p-5 lg:col-span-4">
          <h2 className="font-display text-[1.35rem]">Desk log</h2>
          <ul className="mt-4 space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 border-b border-line pb-3 last:border-0">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember live-dot" />
                <div>
                  <p className="text-[13px] leading-snug">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-mute">{timeAgo(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      </section>
    </PageShell>
  );
}
