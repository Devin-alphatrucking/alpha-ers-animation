import { Link, NavLink } from 'react-router-dom';
import { BadgeDollarSign, CalendarCheck, Inbox, KanbanSquare, LayoutDashboard, Megaphone, Settings2, Star } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { formatMoney } from '../api';
import { isDue, isHot } from '../lib/prospects';

export const groups = [
  {
    label: 'Operations',
    links: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
      { to: '/bookings', label: 'Bookings', icon: CalendarCheck }
    ]
  },
  {
    label: 'Growth',
    links: [
      { to: '/reviews', label: 'Reviews', icon: Star },
      { to: '/pricing', label: 'Plans', icon: BadgeDollarSign }
    ]
  },
  {
    label: 'Your sales',
    ownerOnly: true,
    links: [
      { to: '/prospects', label: 'Pipeline', icon: KanbanSquare, badge: 'due' },
      { to: '/outreach', label: 'Pitch kit', icon: Megaphone },
      { to: '/settings', label: 'Offer', icon: Settings2 }
    ]
  }
];

export default function Sidebar() {
  const { state, prospects, owner, offer } = useDemo();
  const prices = ['starter', 'growth', 'premium'].map((id) => offer?.plans?.[id]?.price).filter(Boolean);
  const headline = offer?.plans?.growth?.price || prices[0] || 79;
  const fromPrice = prices.length ? Math.min(...prices) : headline;
  const yearlySaved = Math.max(0, (state.metrics.competitorMonthly - headline) * 12);
  const days = offer?.setupDays || 2;
  const unread = state.leads.filter((l) => l.unread).length;
  const due = prospects.filter(isDue).length;
  const hot = prospects.filter(isHot).length;

  return (
    <aside className="hidden w-[228px] shrink-0 flex-col bg-[#132822] text-[#f4efe4] md:flex">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-ember font-display text-[15px] text-white">P</span>
        <div className="leading-none">
          <p className="font-display text-[1.05rem]">PulseLocal</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">Front desk OS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.filter((g) => owner || !g.ownerOnly).map((g) => (
          <div key={g.label} className="mb-5">
            <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">{g.label}</p>
            <div className="space-y-0.5">
              {g.links.map((l) => {
                const Icon = l.icon;
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `group relative flex h-9 items-center gap-3 rounded-[6px] px-3 text-[13px] transition ${
                        isActive ? 'bg-white/[0.09] font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive ? <span className="absolute left-0 top-2 h-5 w-[3px] rounded-r bg-ember" /> : null}
                        <Icon size={16} strokeWidth={1.75} />
                        <span className="flex-1">{l.label}</span>
                        {l.badge === 'unread' && unread > 0 ? (
                          <span className="rounded-full bg-ember px-1.5 text-[10px] font-semibold leading-[18px] text-white">{unread}</span>
                        ) : null}
                        {l.badge === 'due' && hot > 0 ? (
                          <span title={`${hot} opened your demo in the last 48h`} className="h-2 w-2 rounded-full bg-[#7fd1a4] live-dot" />
                        ) : null}
                        {l.badge === 'due' && due > 0 ? (
                          <span title="Follow-ups due" className="rounded-full bg-[#E8B04B] px-1.5 text-[10px] font-semibold leading-[18px] text-ink">
                            {due}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {owner ? (
        <Link to="/settings" className="m-3 block rounded-[8px] border border-white/10 bg-white/[0.03] p-3.5 transition hover:bg-white/[0.06]">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Your offer</p>
          <p className="mt-1 font-display text-[1.6rem] leading-none">
            ${headline}<span className="font-sans text-[12px] text-white/45"> /mo</span>
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-white/45">
            Podium charges {formatMoney(state.metrics.competitorMonthly)}. Client keeps ~{formatMoney(yearlySaved)}/yr.
          </p>
        </Link>
      ) : (
        <div className="m-3 rounded-[8px] border border-white/10 bg-white/[0.03] p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Live in {days * 24} hours</p>
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-white">Want this running for {state.business.name}?</p>
          <p className="mt-1.5 text-[11px] leading-snug text-white/50">
            From ${fromPrice}/mo, about {formatMoney(yearlySaved)}/yr less than Podium.
          </p>
          <Link
            to="/pricing"
            className="mt-3 flex h-8 items-center justify-center rounded-[6px] bg-ember text-[12px] font-semibold text-white transition hover:bg-[#b83e10]"
          >
            See plans
          </Link>
        </div>
      )}
    </aside>
  );
}
