import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Store, X } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { gsap } from '../lib/motion';
import { Btn, Field, Select, inputCls, useShake } from './ui';

function fromBusiness(b) {
  return {
    businessName: b.name,
    nicheId: b.nicheId,
    city: b.city,
    currencyCode: b.currencyCode,
    rating: String(b.rating)
  };
}

export default function ProspectSwitcher() {
  const { state, niches, currencies, applyPersonalize, showToast } = useDemo();
  const b = state.business;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => fromBusiness(b));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const wrap = useRef(null);
  const panel = useRef(null);
  const shake = useShake();

  useEffect(() => {
    if (!open) return undefined;
    setForm(fromBusiness(b));
    setErrors({});
    gsap.fromTo(
      panel.current,
      { opacity: 0, y: -8, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out', transformOrigin: 'top right' }
    );
    const onDoc = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate() {
    const res = v.collect({
      businessName: v.businessName(form.businessName),
      city: v.city(form.city),
      rating: v.rating(form.rating),
      nicheId: form.nicheId ? '' : 'Pick an industry',
      currencyCode: form.currencyCode ? '' : 'Pick a currency'
    });
    setErrors(res.errors);
    if (!res.ok) shake.run();
    return res.ok;
  }

  async function apply(copy) {
    if (!validate()) return;
    setBusy(true);
    try {
      const payload = { ...form, businessName: form.businessName.trim(), city: form.city.trim() };
      const next = await applyPersonalize(payload);
      if (copy) {
        const nb = next.business;
        const params = new URLSearchParams({
          biz: nb.name,
          niche: nb.nicheId,
          city: nb.city,
          currency: nb.currencyCode,
          rating: String(nb.rating)
        });
        await navigator.clipboard.writeText(`${window.location.origin}/?${params}`);
        showToast(`Branded as ${nb.name} — link copied`);
      } else {
        showToast(`Workspace branded as ${next.business.name}`);
      }
      setOpen(false);
    } catch (err) {
      showToast(err.message || 'Could not apply branding', 'error');
    } finally {
      setBusy(false);
    }
  }

  const nicheOptions = niches.map((n) => ({ value: n.id, label: n.label }));
  const currencyOptions = currencies.map((c) => ({ value: c.code, label: c.code, hint: c.symbol }));
  const nicheLabel = niches.find((n) => n.id === b.nicheId)?.shortLabel || b.shortLabel;

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 max-w-[280px] items-center gap-2.5 rounded-[6px] border bg-paper pl-1.5 pr-2.5 text-left transition ${
          open ? 'border-pine ring-2 ring-pine/15' : 'border-line hover:border-[#c9bfac]'
        }`}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-pine text-white">
          <Store size={13} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[12.5px] font-semibold text-ink">{b.name}</span>
          <span className="block truncate text-[10.5px] text-mute">
            {nicheLabel} · {b.city} · {b.currency}
          </span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-mute transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          ref={panel}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-[10px] border border-line bg-paper shadow-[0_24px_60px_rgba(23,21,15,0.18)]"
        >
          <div className="flex items-start justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-[14px] font-semibold text-ink">Brand this demo</p>
              <p className="mt-0.5 text-[12px] text-mute">Every screen, script and link updates to the prospect’s shop.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-mute hover:bg-canvas hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <form
            ref={shake.ref}
            className="space-y-3.5 px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              apply(false);
            }}
          >
            <Field label="Industry" error={errors.nicheId}>
              <Select
                ariaLabel="Industry"
                value={form.nicheId}
                options={nicheOptions}
                onChange={(val) => set('nicheId', val)}
                error={errors.nicheId}
              />
            </Field>
            <Field label="Business name" error={errors.businessName}>
              <input
                className={inputCls(errors.businessName)}
                value={form.businessName}
                maxLength={60}
                placeholder="e.g. Miami Glow MedSpa"
                onChange={(e) => set('businessName', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-[1fr_96px_92px] gap-3">
              <Field label="City" error={errors.city}>
                <input
                  className={inputCls(errors.city)}
                  value={form.city}
                  maxLength={40}
                  placeholder="Miami"
                  onChange={(e) => set('city', e.target.value)}
                />
              </Field>
              <Field label="Currency" error={errors.currencyCode}>
                <Select
                  ariaLabel="Currency"
                  value={form.currencyCode}
                  options={currencyOptions}
                  align="right"
                  onChange={(val) => set('currencyCode', val)}
                  error={errors.currencyCode}
                />
              </Field>
              <Field label="Rating" error={errors.rating}>
                <input
                  type="number"
                  min="3"
                  max="5"
                  step="0.1"
                  className={inputCls(errors.rating)}
                  value={form.rating}
                  onChange={(e) => set('rating', e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Btn variant="quiet" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn variant="ghost" disabled={busy} onClick={() => apply(true)}>
                Apply & copy link
              </Btn>
              <Btn type="submit" variant="primary" disabled={busy}>
                Apply
              </Btn>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
