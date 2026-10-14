import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useDemo } from '../../context/DemoContext';
import * as v from '../../lib/validate';
import { COUNTRY_CURRENCY, STAGES, fromDateInput, toDateInput } from '../../lib/prospects';
import { Btn, Drawer, Field, Select, inputCls, useShake } from '../ui';

const blank = {
  businessName: '',
  ownerName: '',
  nicheId: 'medspa',
  city: '',
  country: '',
  currencyCode: 'USD',
  email: '',
  instagram: '',
  phone: '',
  website: '',
  rating: '',
  dealValue: '79',
  stage: 'new',
  nextFollowUp: '',
  notes: ''
};

function toForm(p) {
  if (!p) return blank;
  return {
    ...blank,
    ...Object.fromEntries(Object.entries(p).map(([k, val]) => [k, val ?? ''])),
    instagram: p.instagram ? `@${p.instagram}` : '',
    rating: p.rating ?? '',
    dealValue: p.dealValue ?? '',
    nextFollowUp: toDateInput(p.nextFollowUp)
  };
}

export default function ProspectForm({ open, onClose, prospect, onSaved }) {
  const { niches, currencies, setProspects, showToast } = useDemo();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const shaker = useShake();
  const editing = Boolean(prospect);

  useEffect(() => {
    if (open) {
      setForm(toForm(prospect));
      setErrors({});
    }
  }, [open, prospect]);

  function set(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'country') {
        const code = COUNTRY_CURRENCY[value.trim().toLowerCase()];
        if (code) next.currencyCode = code;
      }
      return next;
    });
    if (errors[key] || ((key === 'email' || key === 'instagram') && (errors.email || errors.instagram))) {
      setErrors((e) => {
        const n = { ...e };
        delete n[key];
        if (key === 'email' || key === 'instagram') {
          if (n.email === 'Add an email or an Instagram handle') delete n.email;
          if (n.instagram === 'Add an email or an Instagram handle') delete n.instagram;
        }
        return n;
      });
    }
  }

  async function submit(e) {
    e?.preventDefault();
    const check = v.prospect(form);
    if (!check.ok) {
      setErrors(check.errors);
      shaker.run();
      return;
    }
    const payload = {
      ...form,
      instagram: form.instagram.replace(/^@/, ''),
      rating: form.rating === '' ? null : Number(form.rating),
      dealValue: form.dealValue === '' ? null : Number(form.dealValue),
      nextFollowUp: fromDateInput(form.nextFollowUp)
    };
    delete payload.id;
    delete payload.activity;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.lastContactedAt;
    setSaving(true);
    try {
      const res = editing ? await api.updateProspect(prospect.id, payload) : await api.createProspect(payload);
      setProspects(res.prospects);
      showToast(editing ? `Saved ${res.prospect.businessName}` : `${res.prospect.businessName} added to pipeline`);
      onSaved?.(res.prospect);
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      shaker.run();
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const nicheOptions = niches.map((n) => ({ value: n.id, label: n.label }));
  const currencyOptions = currencies.map((c) => ({ value: c.code, label: c.code, hint: c.symbol }));
  const stageOptions = STAGES.map((s) => ({ value: s.id, label: s.label }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      kicker={editing ? 'Edit prospect' : 'New prospect'}
      title={editing ? prospect.businessName : 'Add a business to your pipeline'}
      width={540}
      footer={
        <>
          <Btn variant="quiet" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="pine" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add to pipeline'}
          </Btn>
        </>
      }
    >
      <form ref={shaker.ref} onSubmit={submit} noValidate className="space-y-6">
        <section data-stagger className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Business</p>
          <Field label="Business name" error={errors.businessName}>
            <input
              autoFocus
              className={inputCls(errors.businessName)}
              value={form.businessName}
              maxLength={60}
              placeholder="e.g. Glow Theory Aesthetics"
              onChange={(e) => set('businessName', e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry" error={errors.nicheId}>
              <Select value={form.nicheId} onChange={(val) => set('nicheId', val)} options={nicheOptions} ariaLabel="Industry" />
            </Field>
            <Field label="Google rating" error={errors.rating} hint="Optional · 1.0–5.0">
              <input
                className={inputCls(errors.rating)}
                inputMode="decimal"
                value={form.rating}
                placeholder="4.5"
                onChange={(e) => set('rating', e.target.value.replace(/[^\d.]/g, '').slice(0, 3))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
            <Field label="City" error={errors.city}>
              <input className={inputCls(errors.city)} value={form.city} maxLength={40} placeholder="Scottsdale" onChange={(e) => set('city', e.target.value)} />
            </Field>
            <Field label="Country" error={errors.country}>
              <input className={inputCls(errors.country)} value={form.country} maxLength={40} placeholder="USA" onChange={(e) => set('country', e.target.value)} />
            </Field>
            <Field label="Currency">
              <Select value={form.currencyCode} onChange={(val) => set('currencyCode', val)} options={currencyOptions} align="right" ariaLabel="Currency" />
            </Field>
          </div>
        </section>

        <section data-stagger className="space-y-4 border-t border-line pt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Contact</p>
            <p className="text-[11px] text-mute">Email or Instagram required</p>
          </div>
          <Field label="Owner first name" error={errors.ownerName} hint="Used in your DM and email scripts">
            <input className={inputCls(errors.ownerName)} value={form.ownerName} maxLength={50} placeholder="Rachel" onChange={(e) => set('ownerName', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                className={inputCls(errors.email)}
                value={form.email}
                maxLength={80}
                placeholder="owner@business.com"
                onChange={(e) => set('email', e.target.value.trim())}
              />
            </Field>
            <Field label="Instagram" error={errors.instagram}>
              <input
                className={inputCls(errors.instagram)}
                value={form.instagram}
                maxLength={31}
                placeholder="@handle"
                onChange={(e) => {
                  const raw = e.target.value.replace(/\s/g, '');
                  set('instagram', raw && !raw.startsWith('@') ? `@${raw}` : raw);
                }}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone / WhatsApp" error={errors.phone} hint="Optional">
              <input className={inputCls(errors.phone)} value={form.phone} maxLength={22} placeholder="+1 480 555 0199" onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Website" error={errors.website} hint="Optional">
              <input className={inputCls(errors.website)} value={form.website} maxLength={120} placeholder="glowtheory.com" onChange={(e) => set('website', e.target.value.trim())} />
            </Field>
          </div>
        </section>

        <section data-stagger className="space-y-4 border-t border-line pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Deal</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Stage">
              <Select value={form.stage} onChange={(val) => set('stage', val)} options={stageOptions} ariaLabel="Stage" />
            </Field>
            <Field label="Monthly value (USD)" error={errors.dealValue}>
              <input
                className={inputCls(errors.dealValue)}
                inputMode="numeric"
                value={form.dealValue}
                onChange={(e) => set('dealValue', e.target.value.replace(/[^\d.]/g, '').slice(0, 6))}
              />
            </Field>
            <Field label="Next follow-up" error={errors.nextFollowUp}>
              <input type="date" className={inputCls(errors.nextFollowUp)} value={form.nextFollowUp} onChange={(e) => set('nextFollowUp', e.target.value)} />
            </Field>
          </div>
          <Field label="Notes" error={errors.notes} hint={`${form.notes.length}/1000`}>
            <textarea
              rows={3}
              maxLength={1000}
              className={`${inputCls(errors.notes)} h-auto resize-none py-2.5 leading-relaxed`}
              value={form.notes}
              placeholder="Runs Instagram ads, slow DM replies, 3 locations…"
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </section>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
