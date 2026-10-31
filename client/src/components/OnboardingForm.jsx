import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { currentRef } from '../lib/track';
import * as v from '../lib/validate';
import { Btn, Field, Select, inputCls, useShake } from './ui';

export const PLAN_NAMES = {
  starter: 'Starter',
  growth: 'Growth',
  premium: 'Premium',
  setup: 'Done-for-you setup'
};

function validate(f) {
  return v.collect({
    businessName: v.businessName(f.businessName),
    contactName: v.personName(f.contactName),
    email: v.email(f.email),
    phone: v.phone(f.phone),
    googleUrl: v.website(f.googleUrl) ? 'Paste your Google Business or Maps link' : '',
    notes: f.notes.trim().length > 500 ? 'Keep it under 500 characters' : ''
  });
}

export default function OnboardingForm({ offer, initialPlan = '', business, submitLabel = 'Send my details', onDone }) {
  const planIds = Object.keys(offer?.plans || {});
  const [f, setF] = useState({
    plan: planIds.includes(initialPlan) ? initialPlan : planIds.includes('growth') ? 'growth' : planIds[0] || '',
    businessName: business?.name || '',
    contactName: '',
    email: '',
    phone: '',
    googleUrl: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');
  const shaker = useShake();

  const set = (key) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setF((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  async function submit(e) {
    e.preventDefault();
    const check = validate(f);
    setErrors(check.errors);
    setServerError('');
    if (!check.ok) {
      shaker.run();
      return;
    }
    setBusy(true);
    try {
      await api.onboarding({ ...f, ref: currentRef() });
      setDone(true);
      onDone?.(f);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setServerError(err.errors ? '' : err.message);
      shaker.run();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[8px] border border-pine/20 bg-pineSoft p-5">
        <CheckCircle2 size={22} className="text-moss" />
        <p className="mt-3 font-display text-[1.35rem] leading-tight text-ink">Got it, {f.contactName.split(' ')[0]}.</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
          {offer?.founderName || 'We'} will message you on WhatsApp or email within one business day to start the setup for {f.businessName}.
          Your desk goes live in about {offer?.setupDays || 2} days.
        </p>
      </div>
    );
  }

  return (
    <form ref={shaker.ref} onSubmit={submit} noValidate className="space-y-4">
      {planIds.length ? (
        <Field label="Plan">
          <Select
            ariaLabel="Plan"
            value={f.plan}
            onChange={set('plan')}
            options={planIds.map((id) => ({
              value: id,
              label: PLAN_NAMES[id],
              hint: id === 'setup' ? `$${offer.plans[id].price} + $${offer.plans[id].monthly}/mo` : `$${offer.plans[id].price}/mo`
            }))}
          />
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" error={errors.businessName}>
          <input value={f.businessName} onChange={set('businessName')} maxLength={60} className={inputCls(errors.businessName)} />
        </Field>
        <Field label="Your name" error={errors.contactName}>
          <input value={f.contactName} onChange={set('contactName')} maxLength={50} autoComplete="name" className={inputCls(errors.contactName)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={f.email} onChange={set('email')} maxLength={80} autoComplete="email" className={inputCls(errors.email)} />
        </Field>
        <Field label="Mobile / WhatsApp" error={errors.phone} hint="With country code, e.g. +1 512 555 0142">
          <input type="tel" value={f.phone} onChange={set('phone')} maxLength={24} autoComplete="tel" className={inputCls(errors.phone)} />
        </Field>
      </div>
      <Field label="Google Business link (optional)" error={errors.googleUrl} hint="So we can wire up the review booster">
        <input value={f.googleUrl} onChange={set('googleUrl')} maxLength={300} placeholder="https://maps.app.goo.gl/…" className={inputCls(errors.googleUrl)} />
      </Field>
      <Field label="Anything we should know? (optional)" error={errors.notes}>
        <textarea
          value={f.notes}
          onChange={set('notes')}
          rows={3}
          maxLength={500}
          placeholder="Opening hours, booking tool you use, best time to call…"
          className={`${inputCls(errors.notes)} h-auto py-2.5`}
        />
      </Field>
      {serverError ? <p className="text-[12px] font-medium text-ember">{serverError}</p> : null}
      <Btn type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Sending…' : submitLabel}
      </Btn>
    </form>
  );
}
