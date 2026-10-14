import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Mail, Instagram, Video, MessageCircle, Send, KanbanSquare } from 'lucide-react';
import { api, formatMoney } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { OPEN_STAGES, stageLabel } from '../lib/prospects';
import { Badge, Btn, Field, PageShell, Select, Surface, inputCls, useShake } from '../components/ui';

function ScriptCard({ icon: Icon, title, body, onCopy, copied, onLog, logging }) {
  return (
    <Surface className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-canvas">
            <Icon size={15} />
          </span>
          <h3 className="font-display text-[1.25rem]">{title}</h3>
        </div>
        <div className="flex gap-1.5">
          {onLog ? (
            <Btn variant="quiet" size="sm" onClick={onLog} disabled={logging}>
              <Send size={12} />
              {logging ? 'Logging…' : 'Log as sent'}
            </Btn>
          ) : null}
          <Btn variant="ghost" size="sm" onClick={onCopy}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </Btn>
        </div>
      </div>
      <pre className="whitespace-pre-wrap bg-canvas p-4 font-sans text-[13px] leading-relaxed text-ink">{body}</pre>
    </Surface>
  );
}

export default function OutreachKit() {
  const { state, demoLink, showToast, prospects, activeProspect, setProspects, brandForProspect, selectProspect } = useDemo();
  const b = state.business;
  const [kit, setKit] = useState(null);
  const [copied, setCopied] = useState('');
  const [plan, setPlan] = useState('growth');
  const [loadErr, setLoadErr] = useState('');
  const [prospect, setProspect] = useState({ email: '', handle: '', owner: b.ownerFirstName || '' });
  const [errors, setErrors] = useState({});
  const [logging, setLogging] = useState('');
  const [branding, setBranding] = useState(false);
  const shake = useShake();
  const pitching = activeProspect && activeProspect.businessName === b.name ? activeProspect : null;

  useEffect(() => {
    if (!pitching) return;
    setProspect({
      owner: pitching.ownerName ? pitching.ownerName.split(' ')[0] : b.ownerFirstName || '',
      email: pitching.email || '',
      handle: pitching.instagram ? `@${pitching.instagram}` : ''
    });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pitching?.id]);

  async function pickProspect(id) {
    if (!id) {
      selectProspect(null);
      return;
    }
    const p = prospects.find((x) => x.id === id);
    if (!p) return;
    setBranding(true);
    try {
      await brandForProspect(p);
      showToast(`Demo branded as ${p.businessName}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBranding(false);
    }
  }

  async function logSent(type) {
    if (!pitching) return;
    setLogging(type);
    try {
      const res = await api.prospectActivity(pitching.id, {
        type,
        text: type === 'dm' ? 'Instagram DM sent with branded demo' : 'Cold email sent with branded demo',
        followUpDays: 3
      });
      setProspects(res.prospects);
      showToast(`Logged for ${pitching.businessName} · follow-up in 3 days`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLogging('');
    }
  }

  useEffect(() => {
    let live = true;
    api
      .outreach(window.location.origin)
      .then((data) => {
        if (live) {
          setKit(data);
          setLoadErr('');
        }
      })
      .catch((err) => {
        if (live) setLoadErr(err.message || 'Could not load scripts');
      });
    return () => {
      live = false;
    };
  }, [b.name, b.nicheId, b.city, b.currencyCode, b.rating]);

  async function copy(key, text) {
    if (!text) {
      showToast('Nothing to copy yet', 'error');
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(key);
    showToast('Copied');
    window.setTimeout(() => setCopied(''), 1600);
  }

  function personalizeScripts() {
    const noChannel = !prospect.email.trim() && !prospect.handle.replace(/^@/, '').trim();
    const next = v.collect({
      owner: v.personName(prospect.owner),
      email: noChannel ? 'Add an email or an Instagram handle' : v.optionalEmail(prospect.email),
      handle: noChannel ? 'Add an email or an Instagram handle' : v.optionalInstagram(prospect.handle)
    });
    setErrors(next.errors);
    if (!next.ok) {
      shake.run();
      showToast(Object.values(next.errors)[0], 'error');
      return;
    }
    const to = [prospect.handle && `@${prospect.handle.replace(/^@/, '')}`, prospect.email].filter(Boolean).join(' · ');
    showToast(`Scripts ready for ${to}`);
  }

  const prospectOptions = [
    { value: '', label: 'No prospect selected' },
    ...prospects
      .filter((p) => OPEN_STAGES.includes(p.stage))
      .map((p) => ({ value: p.id, label: p.businessName, hint: p.city }))
  ];

  const prices = {
    starter: { fee: 49, label: 'Starter — inbox + missed-call text-back' },
    growth: { fee: 79, label: 'Growth — full desk + bookings + reviews' },
    premium: { fee: 99, label: 'Premium — + monthly optimization call' },
    setup: { fee: 299, label: 'Done-for-you setup + $39/mo' }
  };
  const fee = prices[plan].fee;
  const podium = kit?.pricing.podium || state.metrics.competitorMonthly;
  const yearly = (podium - (plan === 'setup' ? 39 : fee)) * 12;

  if (loadErr) {
    return (
      <PageShell title="Pitch kit" subtitle={loadErr}>
        <Btn variant="ghost" onClick={() => window.location.reload()}>
          Retry
        </Btn>
      </PageShell>
    );
  }

  if (!kit) {
    return (
      <PageShell title="Pitch kit" subtitle="Writing scripts for this prospect…">
        <p className="text-[13px] text-mute">One moment.</p>
      </PageShell>
    );
  }

  const ig = kit.instagramDm.replace(b.ownerFirstName, prospect.owner.trim() || b.ownerFirstName);
  const mail = kit.coldEmail.replace(b.ownerFirstName, prospect.owner.trim() || b.ownerFirstName);

  return (
    <PageShell
      kicker="Founder desk"
      title="Pitch kit"
      subtitle={`Scripts filled with ${b.name}, ${b.city}, and a live demo link.`}
    >
      <Surface className="mb-3 flex flex-wrap items-center gap-3 px-5 py-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Pitching</span>
        <div className="w-72">
          <Select
            value={pitching?.id || ''}
            onChange={pickProspect}
            options={prospectOptions}
            ariaLabel="Choose a prospect from your pipeline"
            className="[&>button]:h-9"
          />
        </div>
        {branding ? <span className="text-[12px] text-mute">Branding demo…</span> : null}
        {pitching ? (
          <>
            <Badge tone="pine">{stageLabel(pitching.stage)}</Badge>
            <span className="text-[12px] text-mute">Demo, scripts, and contact details now match this prospect.</span>
          </>
        ) : (
          <span className="text-[12px] text-mute">Pick a business from your pipeline to brand the demo and log what you send.</span>
        )}
        <Btn as={Link} to="/prospects" variant="ghost" size="sm" className="ml-auto">
          <KanbanSquare size={13} />
          Open pipeline
        </Btn>
      </Surface>

      <section className="grid gap-3 lg:grid-cols-12">
        <Surface className="bg-ink p-6 text-paper lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8c8]">Demo URL</p>
          <p className="mt-2 break-all font-mono text-[12px] text-[#e8c4b0]">{kit.demoLink || demoLink}</p>
          <Btn variant="primary" className="mt-4" onClick={() => copy('link', kit.demoLink)}>
            Copy link
          </Btn>
          <p className="mt-3 text-[12px] text-white/45">They open it and see their own shop name, city, and prices.</p>
        </Surface>

        <Surface className="p-5 lg:col-span-5">
          <h2 className="font-display text-[1.3rem]">Your price vs Podium</h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(prices).map(([id, p]) => (
              <button
                key={id}
                onClick={() => setPlan(id)}
                className={`border px-3 py-2 text-left text-[13px] ${plan === id ? 'border-pine bg-canvas' : 'border-line'}`}
              >
                <span className="font-semibold">{formatMoney(p.fee)}</span>
                <span className="text-mute"> · {p.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 border border-line bg-canvas px-3 py-2 text-[13px] text-pine">
            They save ~{formatMoney(Math.max(0, yearly))}/yr versus ${podium}/mo tools.
          </p>
        </Surface>

        <Surface className="p-5 lg:col-span-12">
          <h2 className="font-display text-[1.3rem]">Prospect details</h2>
          <p className="mb-4 text-[12px] text-mute">Checked before you copy. The owner name is swapped into every script; add an email or Instagram handle.</p>
          <form
            ref={shake.ref}
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              personalizeScripts();
            }}
          >
            <Field label="Owner first name" error={errors.owner}>
              <input
                className={inputCls(errors.owner)}
                value={prospect.owner}
                onChange={(e) => setProspect((p) => ({ ...p, owner: e.target.value }))}
                placeholder="Sofia"
              />
            </Field>
            <Field label="Work email" error={errors.email}>
              <input
                className={inputCls(errors.email)}
                value={prospect.email}
                onChange={(e) => setProspect((p) => ({ ...p, email: e.target.value }))}
                placeholder="sofia@shop.com"
              />
            </Field>
            <Field label="Instagram" error={errors.handle}>
              <input
                className={inputCls(errors.handle)}
                value={prospect.handle}
                onChange={(e) => setProspect((p) => ({ ...p, handle: e.target.value }))}
                placeholder="@miamiglow"
              />
            </Field>
            <div className="flex items-end">
              <Btn type="submit" variant="pine" className="w-full">
                Validate & lock
              </Btn>
            </div>
          </form>
        </Surface>
      </section>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <ScriptCard
          icon={Instagram}
          title="Instagram DM"
          body={ig}
          copied={copied === 'ig'}
          onCopy={() => copy('ig', ig)}
          onLog={pitching ? () => logSent('dm') : null}
          logging={logging === 'dm'}
        />
        <ScriptCard
          icon={Mail}
          title="Cold email"
          body={mail}
          copied={copied === 'email'}
          onCopy={() => copy('email', mail)}
          onLog={pitching ? () => logSent('email') : null}
          logging={logging === 'email'}
        />
        <ScriptCard
          icon={MessageCircle}
          title="WhatsApp"
          body={kit.whatsapp}
          copied={copied === 'wa'}
          onCopy={() => copy('wa', kit.whatsapp)}
        />
        <ScriptCard
          icon={Video}
          title="Loom script"
          body={kit.loomScript}
          copied={copied === 'loom'}
          onCopy={() => copy('loom', kit.loomScript)}
        />
      </div>
    </PageShell>
  );
}
