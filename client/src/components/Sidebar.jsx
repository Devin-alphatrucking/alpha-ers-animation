import { Link, NavLink } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarCheck,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  Search,
  SearchCheck,
  Settings2,
  Star
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { formatMoney } from '../api';
import { isDue, isHot } from '../lib/prospects';
import { Avatar, Logo } from './Brand';
import { openPalette } from './CommandPalette';

export const groups = [
  {
    label: 'Front desk',
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
      { to: '/leads', label: 'Find leads', icon: SearchCheck },
      { to: '/prospects', label: 'Pipeline', icon: KanbanSquare, badge: 'due' },
      { to: '/outreach', label: 'Pitch kit', icon: Megaphone },
      { to: '/settings', label: 'Offer', icon: Settings2 }
    ]
  }
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function Sidebar() {
  const { state, prospects, owner, offer } = useDemo();
  const b = state.business;
  const prices = ['starter', 'growth', 'premium'].map((id) => offer?.plans?.[id]?.price).filter(Boolean);
  const headline = offer?.plans?.growth?.price || prices[0] || 79;
  const fromPrice = prices.length ? Math.min(...prices) : headline;
  const yearlySaved = Math.max(0, (state.metrics.competitorMonthly - headline) * 12);
  const days = offer?.setupDays || 2;
  const unread = state.leads.filter((l) => l.unread).length;
  const due = prospects.filter(isDue).length;
  const hot = prospects.filter(isHot).length;

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col border-r border-line bg-[#FAFAF9] md:flex">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Logo />
      </div>

      <div className="px-3">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-paper p-2 shadow-card">
          <Avatar name={b.name} size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold text-ink">{b.name}</p>
            <p className="truncate text-[11px] text-mute">
              {b.shortLabel} · {b.city}
            </p>
          </div>
          <span title="Desk online" className="mr-1 h-2 w-2 shrink-0 rounded-full bg-moss text-moss live-dot" />
        </div>

        <button
          type="button"
          onClick={openPalette}
          className="mt-2 flex h-9 w-full items-center gap-2 rounded-[8px] px-2.5 text-[13px] text-mute transition hover:bg-ink/[0.04] hover:text-ink"
        >
          <Search size={15} strokeWidth={1.75} />
          <span className="flex-1 text-left">Search</span>
          <span className="flex gap-0.5">
            <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-3 scrollbar-thin">
        {groups
          .filter((g) => owner || !g.ownerOnly)
          .map((g) => (
            <div key={g.label} className="mb-4">
              <p className="mb-1 px-2.5 text-[11px] font-medium text-mute/80">{g.label}</p>
              <div className="space-y-px">
                {g.links.map((l) => {
                  const Icon = l.icon;
                  return (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.to === '/'}
                      className={({ isActive }) =>
                        `group relative flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] transition ${
                          isActive
                            ? 'bg-paper font-medium text-ink shadow-[0_0_0_1px_rgba(13,14,16,0.06),0_1px_2px_rgba(13,14,16,0.06)]'
                            : 'text-ink/65 hover:bg-ink/[0.04] hover:text-ink'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={16} strokeWidth={isActive ? 2 : 1.75} className={isActive ? 'text-ember' : ''} />
                          <span className="flex-1">{l.label}</span>
                          {l.badge === 'unread' && unread > 0 ? (
                            <span className="rounded-[5px] bg-ember px-1.5 font-mono text-[10px] font-semibold leading-[17px] text-white">{unread}</span>
                          ) : null}
                          {l.badge === 'due' && hot > 0 ? (
                            <span title={`${hot} opened your demo in the last 48h`} className="h-2 w-2 rounded-full bg-moss text-moss live-dot" />
                          ) : null}
                          {l.badge === 'due' && due > 0 ? (
                            <span title="Follow-ups due" className="rounded-[5px] bg-gold/20 px-1.5 font-mono text-[10px] font-semibold leading-[17px] text-[#8A5A0B]">
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
        <Link
          to="/settings"
          className="group m-3 block rounded-[12px] border border-line bg-paper p-3.5 shadow-card transition hover:shadow-lift"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-mute">Your offer</p>
            <ArrowUpRight size={14} className="text-mute transition group-hover:text-ink" />
          </div>
          <p className="mt-1 text-[1.6rem] font-semibold leading-none tracking-tightest text-ink">
            ${headline}
            <span className="ml-0.5 text-[12px] font-normal tracking-normal text-mute">/mo</span>
          </p>
          <p className="mt-2 text-[11px] leading-snug text-mute">
            vs Podium {formatMoney(state.metrics.competitorMonthly)}. Client keeps ~{formatMoney(yearlySaved)}/yr.
          </p>
        </Link>
      ) : (
        <div className="relative m-3 overflow-hidden rounded-[12px] bg-night p-4 text-white">
          <div className="dot-grid-dark absolute inset-0 opacity-70" />
          <div className="relative">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Live in {days * 24} hours
            </p>
            <p className="mt-2 text-[14px] font-semibold leading-snug tracking-[-0.01em]">Want this running for {b.name}?</p>
            <p className="mt-1.5 text-[12px] leading-snug text-white/55">
              From ${fromPrice}/mo · about {formatMoney(yearlySaved)}/yr less than Podium.
            </p>
            <Link
              to="/pricing"
              className="mt-3 flex h-8 items-center justify-center gap-1.5 rounded-[8px] bg-white text-[12px] font-semibold text-ink transition hover:bg-white/90"
            >
              See plans <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
