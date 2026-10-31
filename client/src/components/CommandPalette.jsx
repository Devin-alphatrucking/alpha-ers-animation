import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Link2, PhoneMissed, RotateCcw, Search, Sparkles } from 'lucide-react';
import { api } from '../api';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import { groups } from './Sidebar';

const EVENT = 'pl:open-palette';

export function openPalette() {
  window.dispatchEvent(new Event(EVENT));
}

export default function CommandPalette() {
  const { owner, state, setState, demoLink, showToast } = useDemo();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panel = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    window.setTimeout(() => input.current?.focus(), 10);
    if (panel.current) {
      gsap.fromTo(panel.current, { opacity: 0, y: -8, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' });
    }
  }, [open]);

  const items = useMemo(() => {
    const b = state.business;
    const pages = groups
      .filter((g) => owner || !g.ownerOnly)
      .flatMap((g) => g.links.map((l) => ({ id: l.to, group: 'Go to', label: l.label, icon: l.icon, run: () => navigate(l.to) })));
    const actions = [
      { id: 'missed', group: 'Actions', label: 'Simulate a missed call', icon: PhoneMissed, run: () => navigate('/inbox', { state: { simulate: Date.now() } }) },
      { id: 'plans', group: 'Actions', label: `See plans for ${b.name}`, icon: Sparkles, run: () => navigate('/pricing') },
      owner && {
        id: 'copy',
        group: 'Actions',
        label: 'Copy personalised demo link',
        icon: Link2,
        run: () =>
          navigator.clipboard.writeText(demoLink).then(
            () => showToast('Demo link copied'),
            () => showToast('Could not copy', 'error')
          )
      },
      {
        id: 'reset',
        group: 'Actions',
        label: 'Reset demo data',
        icon: RotateCcw,
        run: async () => {
          try {
            setState(await api.reset(b.nicheId));
            showToast('Demo data reset');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      }
    ].filter(Boolean);
    const q = query.trim().toLowerCase();
    return [...actions, ...pages].filter((i) => !q || i.label.toLowerCase().includes(q));
  }, [owner, state.business, navigate, demoLink, showToast, setState, query]);

  function run(item) {
    setOpen(false);
    item?.run();
  }

  function onKey(e) {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      run(items[active]);
    }
  }

  if (!open) return null;
  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Command menu" className="relative w-full max-w-[560px] overflow-hidden rounded-[14px] border border-line bg-paper shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-mute" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-mute/70"
          />
          <kbd className="kbd">esc</kbd>
        </div>
        <ul className="max-h-[340px] overflow-y-auto p-1.5 scrollbar-thin">
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                {header ? <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-mute">{header}</p> : null}
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(item)}
                  className={`flex h-10 w-full items-center gap-3 rounded-[8px] px-2.5 text-left text-[13px] ${
                    i === active ? 'bg-ink/[0.05] text-ink' : 'text-ink/80'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} className={i === active ? 'text-ember' : 'text-mute'} />
                  <span className="flex-1">{item.label}</span>
                  {i === active ? <CornerDownLeft size={13} className="text-mute" /> : null}
                </button>
              </li>
            );
          })}
          {!items.length ? <li className="px-3 py-8 text-center text-[13px] text-mute">No results for “{query}”</li> : null}
        </ul>
        <div className="flex items-center gap-4 border-t border-line bg-canvas/60 px-4 py-2 text-[11px] text-mute">
          <span className="flex items-center gap-1">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="kbd">↵</kbd> open
          </span>
        </div>
      </div>
    </div>
  );
}
