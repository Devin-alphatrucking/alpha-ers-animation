import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Link2, LogOut, RotateCcw } from 'lucide-react';
import { api } from '../api';
import { useDemo } from '../context/DemoContext';
import ProspectSwitcher from './ProspectSwitcher';
import { Btn } from './ui';

const titles = {
  '/': 'Overview',
  '/inbox': 'Inbox',
  '/bookings': 'Bookings',
  '/reviews': 'Reviews',
  '/outreach': 'Pitch kit',
  '/prospects': 'Pipeline',
  '/pricing': 'Plans',
  '/settings': 'Offer & payments'
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { state, setState, demoLink, showToast, owner, authEnabled, logout } = useDemo();
  const [copied, setCopied] = useState(false);
  const b = state.business;
  const initials = b.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(demoLink);
      setCopied(true);
      showToast('Demo link copied');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast('Couldn’t copy — select the link in the Pitch kit instead', 'error');
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
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-ember font-display text-[14px] text-white md:hidden">P</span>
        <span className="hidden truncate text-mute sm:inline">{owner ? 'Workspace' : b.name}</span>
        <span className="hidden text-line sm:inline">/</span>
        <span className="truncate font-semibold text-ink">{titles[pathname] || 'Overview'}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden h-7 items-center gap-1.5 rounded-full border border-line px-2.5 text-[11px] font-medium text-pine lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-moss live-dot" />
          Desk online
        </span>
        {owner ? (
          <>
            <div className="hidden md:block">
              <ProspectSwitcher />
            </div>
            <Btn variant="ghost" onClick={copyLink} title="Copy personalized demo link">
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              <span className="hidden xl:inline">{copied ? 'Copied' : 'Copy link'}</span>
            </Btn>
          </>
        ) : pathname !== '/pricing' ? (
          <Btn as={Link} to="/pricing" variant="primary" className="max-w-[46vw] sm:max-w-none">
            <span className="truncate">
              <span className="sm:hidden">See plans</span>
              <span className="hidden sm:inline">Get this for {b.name}</span>
            </span>
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
        <span className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper" title={owner ? 'Owner' : b.name}>
          {owner ? 'DV' : initials}
        </span>
      </div>
    </header>
  );
}
