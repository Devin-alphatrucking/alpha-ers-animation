import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { useDemo } from '../context/DemoContext';
import { PLAN_NAMES } from '../components/OnboardingForm';
import { Btn, Field, PageShell, Surface, inputCls, useShake } from '../components/ui';

const PLAN_ORDER = ['starter', 'growth', 'premium', 'setup'];

function httpsError(value, msg) {
  const s = String(value || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && u.hostname.includes('.') ? '' : msg;
  } catch {
    return msg;
  }
}

function validate(f) {
  const errors = {};
  if (f.brandName.trim().length < 2 || f.brandName.trim().length > 40) errors.brandName = 'Brand name must be 2–40 characters';
  if (f.founderName.trim() && !/^[\p{L}][\p{L} .'-]*$/u.test(f.founderName.trim())) errors.founderName = 'Use letters only';
  if (f.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.contactEmail.trim())) errors.contactEmail = 'Enter a valid email';
  const wa = f.whatsapp.replace(/\D/g, '');
  if (f.whatsapp.trim() && (wa.length < 10 || wa.length > 15)) errors.whatsapp = 'Include country code, e.g. +91 98765 43210';
  const cal = httpsError(f.calendlyUrl, 'Use a full https:// link');
  if (cal) errors.calendlyUrl = cal;
  const vid = httpsError(f.videoUrl, 'Use a full https:// Loom or YouTube link');
  if (vid) errors.videoUrl = vid;
  const days = Number(f.setupDays);
  if (!Number.isInteger(days) || days < 1 || days > 14) errors.setupDays = '1–14 days';
  PLAN_ORDER.forEach((id) => {
    const p = f.plans[id];
    const price = Number(p.price);
    if (!Number.isFinite(price) || price < 1 || price > 5000) errors[`${id}.price`] = '1–5000';
    const link = httpsError(p.link, 'Must start with https://');
    if (link) errors[`${id}.link`] = link;
    if (id === 'setup') {
      const mo = Number(p.monthly);
      if (!Number.isFinite(mo) || mo < 0 || mo > 1000) errors['setup.monthly'] = '0–1000';
    }
  });
  if (!PLAN_ORDER.some((id) => f.plans[id].enabled)) errors['growth.price'] = 'Keep at least one plan switched on';
  return errors;
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-pine' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Settings() {
  const { setOffer, showToast } = useDemo();
  const [f, setF] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const shaker = useShake();
  const origin = window.location.origin;

  useEffect(() => {
    api
      .settings()
      .then((data) => setF({ ...data, setupDays: String(data.setupDays) }))
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) {
    return (
      <PageShell kicker="Your sales" title="Offer & payments">
        <Surface className="p-6 text-[13px] text-ember">{loadError}</Surface>
      </PageShell>
    );
  }
  if (!f) return null;

  const set = (key) => (e) => {
    setF((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };
  const setPlan = (id, key, value) => {
    setF((prev) => ({ ...prev, plans: { ...prev.plans, [id]: { ...prev.plans[id], [key]: value } } }));
    const errKey = `${id}.${key}`;
    if (errors[errKey] || errors['growth.price']) setErrors((prev) => ({ ...prev, [errKey]: '', 'growth.price': '' }));
  };

  async function save(e) {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      shaker.run();
      return;
    }
    setBusy(true);
    try {
      const saved = await api.saveSettings({ ...f, setupDays: Number(f.setupDays) });
      setF({ ...saved, setupDays: String(saved.setupDays) });
      setOffer(await api.offer());
      showToast('Offer saved. The pricing page is updated.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      showToast(err.errors ? 'Fix the highlighted fields' : err.message, 'error');
      shaker.run();
    } finally {
      setBusy(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied'),
      () => showToast('Could not copy', 'error')
    );
  }

  return (
    <PageShell
      kicker="Your sales"
      title="Offer & payments"
      subtitle="Prices, payment links and contact options shown on the pricing page every prospect sees."
      actions={
        <Btn as={Link} to="/pricing" variant="ghost">
          <ExternalLink size={14} /> Preview pricing page
        </Btn>
      }
    >
      <form ref={shaker.ref} onSubmit={save} noValidate className="grid gap-3 lg:grid-cols-12">
        <Surface className="p-6 lg:col-span-7">
          <h2 className="font-display text-[1.35rem]">Plans</h2>
          <p className="mt-1 text-[12px] text-mute">
            Paste a Razorpay Payment Page or Stripe Payment Link for each plan. Without a link, prospects can still reserve.
          </p>
          {errors['growth.price'] && !f.plans.growth.enabled ? (
            <p className="mt-3 text-[12px] font-medium text-ember">{errors['growth.price']}</p>
          ) : null}
          <ul className="mt-5 space-y-4">
            {PLAN_ORDER.map((id) => {
              const p = f.plans[id];
              return (
                <li key={id} className={`rounded-[8px] border border-line p-4 ${p.enabled ? '' : 'opacity-60'}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[14px] font-semibold">{PLAN_NAMES[id]}</p>
                    <label className="flex items-center gap-2 text-[12px] text-mute">
                      {p.enabled ? 'Shown' : 'Hidden'}
                      <Toggle on={p.enabled} onChange={(v) => setPlan(id, 'enabled', v)} label={`Show ${PLAN_NAMES[id]}`} />
                    </label>
                  </div>
                  <div className={`grid gap-3 ${id === 'setup' ? 'sm:grid-cols-[110px_110px_1fr]' : 'sm:grid-cols-[110px_1fr]'}`}>
                    <Field label={id === 'setup' ? 'Setup ($)' : 'Monthly ($)'} error={errors[`${id}.price`]}>
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        value={p.price}
                        onChange={(e) => setPlan(id, 'price', e.target.value)}
                        className={inputCls(errors[`${id}.price`])}
                      />
                    </Field>
                    {id === 'setup' ? (
                      <Field label="Then / mo ($)" error={errors['setup.monthly']}>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={p.monthly}
                          onChange={(e) => setPlan(id, 'monthly', e.target.value)}
                          className={inputCls(errors['setup.monthly'])}
                        />
                      </Field>
                    ) : null}
                    <Field label="Payment link" error={errors[`${id}.link`]}>
                      <input
                        value={p.link}
                        onChange={(e) => setPlan(id, 'link', e.target.value)}
                        placeholder="https://rzp.io/l/… or https://buy.stripe.com/…"
                        maxLength={500}
                        className={inputCls(errors[`${id}.link`])}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-mute">
                    <span className="shrink-0">After payment, redirect to</span>
                    <code className="min-w-0 truncate rounded bg-canvas px-1.5 py-0.5 font-mono">{`${origin}/welcome?plan=${id}`}</code>
                    <button
                      type="button"
                      onClick={() => copy(`${origin}/welcome?plan=${id}`)}
                      aria-label="Copy redirect URL"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-mute hover:bg-canvas hover:text-ink"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Surface>

        <div className="space-y-3 lg:col-span-5">
          <Surface className="space-y-4 p-6">
            <h2 className="font-display text-[1.35rem]">Brand & contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand name" error={errors.brandName}>
                <input value={f.brandName} onChange={set('brandName')} maxLength={40} className={inputCls(errors.brandName)} />
              </Field>
              <Field label="Your name" error={errors.founderName} hint="Signs your cold emails">
                <input value={f.founderName} onChange={set('founderName')} maxLength={40} className={inputCls(errors.founderName)} />
              </Field>
            </div>
            <Field label="Contact email" error={errors.contactEmail}>
              <input type="email" value={f.contactEmail} onChange={set('contactEmail')} maxLength={80} className={inputCls(errors.contactEmail)} />
            </Field>
            <Field label="WhatsApp number" error={errors.whatsapp} hint="With country code. Prospects get a prefilled message.">
              <input value={f.whatsapp} onChange={set('whatsapp')} maxLength={20} placeholder="+91 98765 43210" className={inputCls(errors.whatsapp)} />
            </Field>
            <Field label="Calendly / booking link" error={errors.calendlyUrl}>
              <input value={f.calendlyUrl} onChange={set('calendlyUrl')} maxLength={300} placeholder="https://calendly.com/you/10min" className={inputCls(errors.calendlyUrl)} />
            </Field>
          </Surface>

          <Surface className="space-y-4 p-6">
            <h2 className="font-display text-[1.35rem]">Pricing page</h2>
            <Field label="Walkthrough video" error={errors.videoUrl} hint="Loom or YouTube. Shown above the plans.">
              <input value={f.videoUrl} onChange={set('videoUrl')} maxLength={300} placeholder="https://www.loom.com/share/…" className={inputCls(errors.videoUrl)} />
            </Field>
            <Field label="Setup time (days)" error={errors.setupDays}>
              <input type="number" min="1" max="14" value={f.setupDays} onChange={set('setupDays')} className={`${inputCls(errors.setupDays)} sm:w-28`} />
            </Field>
          </Surface>

          <Surface className="p-6 text-[12px] leading-relaxed text-mute">
            <p className="text-[13px] font-semibold text-ink">How payments are tracked</p>
            <p className="mt-1.5">
              Pay buttons go through your server first, so a click from a tracked demo link shows up in the Pipeline as
              “clicked Pay” and the prospect is moved to today's follow-ups. The welcome form after payment is logged the
              same way.
            </p>
          </Surface>

          <Btn type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save offer'}
          </Btn>
        </div>
      </form>
    </PageShell>
  );
}
