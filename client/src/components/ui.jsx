import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Check, ChevronDown, X } from 'lucide-react';
import { gsap, reveal, shake } from '../lib/motion';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Btn({ as, variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  const Comp = as || 'button';
  const styles = {
    primary: 'bg-ember text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] hover:bg-[#b83e10]',
    pine: 'bg-pine text-white hover:bg-pineBright',
    ghost: 'border border-line bg-paper text-ink hover:border-[#c9bfac] hover:bg-canvas',
    ink: 'bg-ink text-paper hover:bg-[#2a261f]',
    quiet: 'text-mute hover:bg-canvas hover:text-ink'
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
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-semibold leading-none transition active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-40',
        sizes[size],
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={cx('block text-[12px] font-medium text-mute', className)}>
      {label ? <span className="mb-1.5 block text-ink/80">{label}</span> : null}
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] font-medium text-ember">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] font-normal text-mute/80">{hint}</span>
      ) : null}
    </div>
  );
}

export function inputCls(error) {
  return cx(
    'h-10 w-full rounded-[6px] border bg-paper px-3 text-[13px] text-ink outline-none transition placeholder:text-mute/50',
    error
      ? 'border-ember ring-2 ring-ember/15'
      : 'border-line hover:border-[#c9bfac] focus:border-pine focus:ring-2 focus:ring-pine/15'
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
        { opacity: 0, y: -6, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out', transformOrigin: 'top center' }
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
          'flex h-10 w-full items-center justify-between gap-2 rounded-[6px] border bg-paper px-3 text-left text-[13px] text-ink outline-none transition',
          error
            ? 'border-ember ring-2 ring-ember/15'
            : open
              ? 'border-pine ring-2 ring-pine/15'
              : 'border-line hover:border-[#c9bfac] focus-visible:border-pine focus-visible:ring-2 focus-visible:ring-pine/15'
        )}
      >
        <span className={cx('flex min-w-0 items-center gap-2', !selected && 'text-mute/60')}>
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
            'absolute z-[60] mt-1.5 max-h-64 min-w-full overflow-auto rounded-[8px] border border-line bg-paper p-1 shadow-[0_18px_44px_rgba(23,21,15,0.16)] scrollbar-thin',
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
                  'flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-[5px] px-2.5 py-2 text-[13px]',
                  i === active && 'bg-canvas',
                  on ? 'font-semibold text-pine' : 'text-ink'
                )}
              >
                <span className="flex items-center gap-2">
                  {o.label}
                  {o.hint ? <span className="font-mono text-[11px] font-normal text-mute">{o.hint}</span> : null}
                </span>
                {on ? <Check size={14} className="shrink-0 text-pine" /> : <span className="w-[14px]" />}
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
    <div className="inline-flex rounded-[7px] border border-line bg-canvas p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-7 whitespace-nowrap rounded-[5px] px-3 text-[12px] font-medium transition',
            value === o.value ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(23,21,15,0.08)]' : 'text-mute hover:text-ink'
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
    neutral: 'bg-canvas text-mute',
    pine: 'bg-[#e3ece5] text-pine',
    ember: 'bg-[#f6e3d8] text-ember',
    ink: 'bg-ink text-paper'
  };
  return (
    <span className={cx('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium capitalize', tones[tone])}>
      {children}
    </span>
  );
}

export function PageShell({ kicker, title, subtitle, actions, children }) {
  const ref = useRef(null);
  useGSAP(() => reveal(ref.current), { scope: ref, dependencies: [title] });

  return (
    <div ref={ref} className="pb-12">
      <header data-reveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {kicker ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">{kicker}</p> : null}
          <h1 className="font-display text-[2.15rem] leading-[1.05] text-ink md:text-[2.55rem]">{title}</h1>
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
    <div data-reveal={doReveal ? '' : undefined} className={cx('rounded-[8px] border border-line bg-paper', className)}>
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

  return <span ref={ref}>{`${prefix}${Math.round(numeric).toLocaleString('en-US')}${suffix}`}</span>;
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
    tl.fromTo(panel.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.34, ease: 'power3.out' }, 0);
    const items = panel.current?.querySelectorAll('[data-stagger]');
    if (items?.length) {
      tl.fromTo(items, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out' }, 0.1);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      tl.kill();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <div ref={veil} className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className="relative flex h-full w-full flex-col border-l border-line bg-paper shadow-[-24px_0_60px_rgba(23,21,15,0.14)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            {kicker ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">{kicker}</p> : null}
            <h2 className="truncate font-display text-[1.45rem] leading-tight text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-mute transition hover:bg-canvas hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer ? <footer className="flex items-center justify-end gap-2 border-t border-line bg-canvas/50 px-6 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function Toast({ toast }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!toast || !ref.current) return undefined;
    const tween = gsap.fromTo(
      ref.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );
    return () => tween.kill();
  }, [toast]);

  if (!toast) return null;
  const error = toast.tone === 'error';
  return (
    <div
      ref={ref}
      className={cx(
        'fixed bottom-5 right-5 z-[70] max-w-sm rounded-[6px] px-4 py-3 text-[13px] text-paper shadow-[0_12px_40px_rgba(23,21,15,0.18)]',
        error ? 'bg-ember' : 'bg-ink'
      )}
    >
      {toast.msg || toast}
    </div>
  );
}
