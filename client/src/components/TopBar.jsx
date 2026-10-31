import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronRight, Link2, LogOut, RotateCcw, Search } from 'lucide-react';
import { api } from '../api';
import { useDemo } from '../context/DemoContext';
import ProspectSwitcher from './ProspectSwitcher';
import { LogoMark } from './Brand';
import { openPalette } from './CommandPalette';
import { Btn } from './ui';

const titles = {
  '/': 'Overview',
  '/inbox': 'Inbox',
  '/bookings': 'Bookings',
  '/reviews': 'Reviews',
  '/outreach': 'Pitch kit',
  '/prospects': 'Pipeline',
  '/pricing': 'Plans',
  '/leads': 'Lead finder',
  '/settings': 'Offer & payments'
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { state, setState, demoLink, showToast, owner, authEnabled, logout } = useDemo();
  const [copied, setCopied] = useState(false);
  const b = state.business;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(demoLink);
      setCopied(true);
      showToast('Demo link copied');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast('Couldn’t copy. Select the link in the Pitch kit instead.', 'error');
    }
  }

  async function reset() {
    try {
      const next = await api.reset(b.nicheId);
      setState(next);
      showToast('Demo data reset');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="md:hidden">
          <LogoMark size={26} />
        </span>
        <span className="hidden truncate text-mute sm:inline">{owner ? 'Workspace' : b.name}</span>
        <ChevronRight size={14} className="hidden shrink-0 text-mute/60 sm:inline" />
        <span className="truncate font-medium text-ink">{titles[pathname] || 'Overview'}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-1 hidden h-7 items-center gap-2 rounded-full bg-pineSoft px-2.5 text-[11px] font-medium text-pine ring-1 ring-inset ring-pine/15 lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-moss text-moss live-dot" />
          Desk online · {state.metrics.aiResponseSecs}s replies
        </span>
        <Btn variant="quiet" onClick={openPalette} title="Search (Ctrl/⌘ K)" className="w-9 px-0 md:hidden">
          <Search size={15} />
        </Btn>
        {owner ? (
          <>
            <div className="hidden md:block">
              <ProspectSwitcher />
            </div>
            <Btn variant="ghost" onClick={copyLink} title="Copy personalized demo link">
              {copied ? <Check size={14} className="text-moss" /> : <Link2 size={14} />}
              <span className="hidden xl:inline">{copied ? 'Copied' : 'Copy link'}</span>
            </Btn>
          </>
        ) : pathname !== '/pricing' ? (
          <Btn as={Link} to="/pricing" variant="ink" className="max-w-[46vw] sm:max-w-none">
            <span className="truncate">
              <span className="sm:hidden">See plans</span>
              <span className="hidden sm:inline">Get this for {b.name}</span>
            </span>
            <ArrowUpRight size={14} className="shrink-0" />
          </Btn>
        ) : null}
        <Btn variant="quiet" onClick={reset} title="Reset demo data" className="w-9 px-0">
          <RotateCcw size={14} />
        </Btn>
        {owner && authEnabled ? (
          <Btn variant="quiet" onClick={logout} title="Log out of owner area" className="w-9 px-0">
            <LogOut size={14} />
          </Btn>
        ) : null}
      </div>
    </header>
  );
}
