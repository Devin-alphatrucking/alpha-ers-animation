import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Check, ChevronDown, CircleAlert, X } from 'lucide-react';
import { gsap, reveal, shake } from '../lib/motion';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Btn({ as, variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  const Comp = as || 'button';
  const styles = {
    primary: 'bg-ember text-white shadow-btn hover:bg-emberDeep',
    pine: 'bg-ink text-white shadow-btn hover:bg-inkSoft',
    ink: 'bg-ink text-white shadow-btn hover:bg-inkSoft',
    ghost: 'border border-line bg-paper text-ink shadow-card hover:border-lineStrong hover:bg-[#FAFAF9]',
    quiet: 'text-mute hover:bg-ink/[0.04] hover:text-ink'
  };
  const sizes = {
    sm: 'h-8 px-2.5 text-[12px]',
    md: 'h-9 px-3.5 text-[13px]',
    lg: 'h-11 px-5 text-[14px]'
  };
  return (
    <Comp
      type={Comp === 'button' ? type : undefined}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-medium leading-none tracking-[-0.01em] transition duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
        sizes[size],
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={cx('block text-[12px] font-medium text-mute', className)}>
      {label ? <span className="mb-1.5 block text-[12px] font-medium text-ink/80">{label}</span> : null}
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-ember">
          <CircleAlert size={12} className="shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] font-normal text-mute">{hint}</span>
      ) : null}
    </div>
  );
}

export function inputCls(error) {
  return cx(
    'h-10 w-full rounded-[8px] border bg-paper px-3 text-[13px] text-ink shadow-card outline-none transition placeholder:text-mute/60',
    error
      ? 'border-ember ring-4 ring-ember/10'
      : 'border-line hover:border-lineStrong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.06]'
  );
}

export function Select({ value, onChange, options, error, className = '', align = 'left', ariaLabel, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const list = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDoc = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    if (list.current) {
      gsap.fromTo(
        list.current,
        { opacity: 0, y: -4, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out', transformOrigin: 'top center' }
      );
    }
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(o) {
    onChange(o.value);
    setOpen(false);
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) choose(options[active]);
      else setOpen(true);
    }
  }

  return (
    <div ref={wrap} className={cx('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        className={cx(
          'flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border bg-paper px-3 text-left text-[13px] text-ink shadow-card outline-none transition',
          error
            ? 'border-ember ring-4 ring-ember/10'
            : open
              ? 'border-ink/40 ring-4 ring-ink/[0.06]'
              : 'border-line hover:border-lineStrong focus-visible:border-ink/40 focus-visible:ring-4 focus-visible:ring-ink/[0.06]'
        )}
      >
        <span className={cx('flex min-w-0 items-center gap-2', !selected && 'text-mute/70')}>
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          {selected?.hint ? <span className="shrink-0 font-mono text-[11px] text-mute">{selected.hint}</span> : null}
        </span>
        <ChevronDown size={15} className={cx('shrink-0 text-mute transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open ? (
        <ul
          ref={list}
          role="listbox"
          className={cx(
            'absolute z-[60] mt-1.5 max-h-64 min-w-full overflow-auto rounded-[10px] border border-line bg-paper p-1 shadow-pop scrollbar-thin',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {options.map((o, i) => {
            const on = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                className={cx(
                  'flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-[6px] px-2.5 py-2 text-[13px]',
                  i === active && 'bg-ink/[0.04]',
                  on ? 'font-medium text-ink' : 'text-ink/80'
                )}
              >
                <span className="flex items-center gap-2">
                  {o.label}
                  {o.hint ? <span className="font-mono text-[11px] font-normal text-mute">{o.hint}</span> : null}
                </span>
                {on ? <Check size={14} className="shrink-0 text-ember" /> : <span className="w-[14px]" />}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-[9px] bg-ink/[0.05] p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-7 whitespace-nowrap rounded-[7px] px-3 text-[12px] font-medium transition',
            value === o.value ? 'bg-paper text-ink shadow-card' : 'text-mute hover:text-ink'
          )}
        >
          {o.label}
          {o.count !== undefined ? <span className="ml-1.5 font-mono text-[10px] text-mute">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-ink/[0.04] text-mute ring-ink/[0.06]',
    pine: 'bg-pineSoft text-pine ring-pine/15',
    ember: 'bg-emberSoft text-emberDeep ring-ember/20',
    ink: 'bg-ink text-white ring-ink'
  };
  return (
    <span
      className={cx(
        'inline-flex h-[22px] items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium capitalize ring-1 ring-inset',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function PageShell({ kicker, title, subtitle, actions, children }) {
  const ref = useRef(null);
  useGSAP(() => reveal(ref.current), { scope: ref, dependencies: [title] });

  return (
    <div ref={ref} className="pb-12">
      <header data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {kicker ? (
            <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-mute">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-ember" />
              {kicker}
            </p>
          ) : null}
          <h1 className="font-display text-[1.9rem] leading-[1.08] text-ink md:text-[2.25rem]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mute">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function Surface({ className = '', reveal: doReveal = true, children }) {
  return (
    <div data-reveal={doReveal ? '' : undefined} className={cx('rounded-[12px] border border-line shadow-card', /\bbg-/.test(className) ? '' : 'bg-paper', className)}>
      {children}
    </div>
  );
}

export function Count({ value, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const numeric = Number(String(value).replace(/[^\d.-]/g, '')) || 0;

  useGSAP(() => {
    const obj = { n: 0 };
    gsap.to(obj, {
      n: numeric,
      duration: 1.05,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(obj.n).toLocaleString('en-US')}${suffix}`;
        }
      }
    });
  }, { dependencies: [numeric, prefix, suffix] });

  return <span ref={ref} className="tabular">{`${prefix}${Math.round(numeric).toLocaleString('en-US')}${suffix}`}</span>;
}

export function Sparkline({ data, className = '', stroke = '#F0561D', height = 32 }) {
  const values = data.length ? data : [0, 0];
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const w = 100;
  const pts = values.map((v, i) => [(i / (values.length - 1 || 1)) * w, height - 2 - ((v - min) / (max - min || 1)) * (height - 6)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const id = useRef(`sp${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cx('w-full', className)} style={{ height }} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function useShake() {
  const ref = useRef(null);
  return {
    ref,
    run: () => shake(ref.current)
  };
}

export function Drawer({ open, onClose, title, kicker, width = 480, footer, children }) {
  const panel = useRef(null);
  const veil = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const tl = gsap.timeline();
    tl.fromTo(veil.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    tl.fromTo(panel.current, { x: 32, opacity: 0 }, { x: 0, opacity: 1, duration: 0.32, ease: 'power3.out' }, 0);
    const items = panel.current?.querySelectorAll('[data-stagger]');
    if (items?.length) {
      tl.fromTo(items, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.03, ease: 'power2.out' }, 0.1);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      tl.kill();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex justify-end p-0 sm:p-2">
      <div ref={veil} className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className="relative flex h-full w-full flex-col overflow-hidden border border-line bg-paper shadow-pop sm:rounded-[14px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            {kicker ? <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-mute">{kicker}</p> : null}
            <h2 className="truncate font-display text-[1.35rem] leading-tight text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-mute transition hover:bg-ink/[0.05] hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer ? <footer className="flex items-center justify-end gap-2 border-t border-line bg-canvas/60 px-6 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function Toast({ toast }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!toast || !ref.current) return undefined;
    const tween = gsap.fromTo(ref.current, { y: 20, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    return () => tween.kill();
  }, [toast]);

  if (!toast) return null;
  const error = toast.tone === 'error';
  return (
    <div
      ref={ref}
      role="status"
      className="fixed bottom-20 left-4 right-4 z-[70] flex items-center gap-2.5 rounded-[10px] bg-ink px-4 py-3 text-[13px] text-white shadow-pop md:bottom-5 md:left-auto md:right-5 md:max-w-sm"
    >
      <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full', error ? 'bg-ember' : 'bg-moss')}>
        {error ? <X size={11} strokeWidth={3} /> : <Check size={11} strokeWidth={3} />}
      </span>
      {toast.msg || toast}
    </div>
  );
}
