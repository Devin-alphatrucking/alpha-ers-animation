import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Link2, RotateCcw } from 'lucide-react';
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
  '/prospects': 'Pipeline'
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { state, setState, demoLink, showToast } = useDemo();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(demoLink);
    setCopied(true);
    showToast('Demo link copied');
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function reset() {
    const next = await api.reset(state.business.nicheId);
    setState(next);
    showToast('Demo data reset');
  }

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-paper/85 px-6 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        <span className="text-mute">Workspace</span>
        <span className="text-line">/</span>
        <span className="truncate font-semibold text-ink">{titles[pathname] || 'Overview'}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden h-7 items-center gap-1.5 rounded-full border border-line px-2.5 text-[11px] font-medium text-pine lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-moss live-dot" />
          Desk online
        </span>
        <ProspectSwitcher />
        <Btn variant="ghost" onClick={copyLink} title="Copy personalized demo link">
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          <span className="hidden xl:inline">{copied ? 'Copied' : 'Copy link'}</span>
        </Btn>
        <Btn variant="quiet" onClick={reset} title="Reset demo data" className="w-9 px-0">
          <RotateCcw size={14} />
        </Btn>
        <span className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper">DV</span>
      </div>
    </header>
  );
}
