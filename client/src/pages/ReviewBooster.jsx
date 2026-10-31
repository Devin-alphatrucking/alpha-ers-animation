import { useState } from 'react';
import { ShieldAlert, Star, ExternalLink, Send } from 'lucide-react';
import { api, formatWhen, timeAgo } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { trackAction } from '../lib/track';
import { Btn, Count, Field, PageShell, Surface, inputCls, useShake } from '../components/ui';

function Stars({ value, onChange, size = 28 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5" aria-label={`${n} stars`}>
          <Star size={size} className={n <= value ? 'fill-ember text-ember' : 'text-line'} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewBooster() {
  const { state, setState, showToast } = useDemo();
  const { business: b, reviews, privateFlags, reviewCampaigns: c } = state;
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [customer, setCustomer] = useState('Taylor Brooks');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const shake = useShake();

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `${window.location.origin}/reviews?biz=${encodeURIComponent(b.name)}`
  )}`;

  const suggestions = [
    `${b.name} in ${b.city} made booking effortless — replied in seconds and the visit was excellent.`,
    `Professional from the first text. I never waited on hold. Highly recommend ${b.name}.`,
    `Reminders were perfect and the team actually followed up.`
  ];

  async function submit(e) {
    e.preventDefault();
    const next = v.collect({
      stars: v.stars(stars),
      customer: v.personName(customer),
      text:
        stars > 0 && stars <= 3
          ? v.message(text, { min: 12, max: 400, label: 'Private feedback' })
          : v.message(text, { min: 0, max: 400, label: 'Review' })
    });
    setErrors(next.errors);
    if (!next.ok) {
      shake.run();
      showToast(Object.values(next.errors)[0], 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await api.submitReview({ stars, text: text.trim(), customer: customer.trim() });
      setState(res.state);
      trackAction('review');
      setResult(res);
      showToast(res.route === 'google' ? 'Routed to Google Maps' : 'Intercepted privately');
    } finally {
      setBusy(false);
    }
  }

  async function blast() {
    const next = await api.requestReview('last 7 completed visits');
    setState(next);
    showToast('Campaign queued to completed clients');
  }

  async function resolve(id) {
    const next = await api.resolveFlag(id);
    setState(next);
  }

  return (
    <PageShell
      kicker="Reputation"
      title="Review booster"
      subtitle={`Happy clients go public. Unhappy clients stay private. ${b.name} stays at ${b.rating}★+.`}
      actions={
        <Btn variant="primary" onClick={blast}>
          <Send size={14} /> Send campaign
        </Btn>
      }
    >
      <Surface className="mb-3 grid grid-cols-2 overflow-hidden sm:grid-cols-4">
        {[
          ['Requests sent', c.sent, null],
          ['Opened', c.opened, c.sent],
          ['5★ Google clicks', c.fiveStarClicks, c.opened],
          ['Intercepted 1–3★', c.intercepted, c.opened]
        ].map(([label, value, of], i) => (
          <div key={label} className={`p-5 ${i % 2 === 0 ? 'border-r border-line' : 'sm:border-r sm:border-line'} ${i < 2 ? 'border-b border-line sm:border-b-0' : ''} last:border-r-0`}>
            <p className="text-[12px] font-medium text-mute">{label}</p>
            <p className="mt-2.5 flex items-baseline gap-2 text-[1.9rem] font-semibold leading-none tracking-tightest">
              <Count value={value} />
              {of ? <span className="font-mono text-[11px] font-normal tracking-normal text-mute">{Math.round((value / (of || 1)) * 100)}%</span> : null}
            </p>
          </div>
        ))}
      </Surface>

      <section className="grid gap-3 xl:grid-cols-2">
        <Surface className="p-5">
          <h2 className="font-display text-[1.35rem]">Customer funnel</h2>
          <p className="mb-4 text-[12px] text-mute">4–5★ goes to Google. 1–3★ opens the shield.</p>
          <form ref={shake.ref} onSubmit={submit} className="space-y-4">
            <p className="text-[14px] font-medium">How was your visit at {b.name}?</p>
            <Stars
              value={stars}
              onChange={(n) => {
                setStars(n);
                setResult(null);
                setErrors((e) => ({ ...e, stars: '' }));
              }}
            />
            {errors.stars ? <p className="text-[12px] text-ember">{errors.stars}</p> : null}
            {stars >= 4 ? (
              <div className="space-y-2 border border-line bg-canvas p-3">
                <p className="text-[12px] font-medium text-pine">Draft they can paste on Google</p>
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setText(s)}
                    className="block w-full bg-paper px-3 py-2 text-left text-[12px] hover:border-pine"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {stars > 0 && stars <= 3 ? (
              <div className="border border-ember/30 bg-emberSoft p-3 text-[13px]">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldAlert size={15} className="text-ember" /> We’ll fix this privately.
                </p>
                <p className="mt-1 text-[12px] text-mute">Goes to {b.ownerFirstName} — never posted on Google.</p>
              </div>
            ) : null}
            <Field label="Customer name" error={errors.customer}>
              <input
                className={inputCls(errors.customer)}
                value={customer}
                maxLength={50}
                onChange={(e) => setCustomer(e.target.value)}
              />
            </Field>
            <Field
              label={stars <= 3 && stars > 0 ? 'What went wrong?' : 'Review text'}
              error={errors.text}
              hint={stars <= 3 && stars > 0 ? 'At least 12 characters' : 'Optional for 4–5 stars'}
            >
              <textarea
                className={`min-h-[96px] w-full resize-y rounded-[6px] border bg-paper px-3 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-mute/50 ${
                  errors.text ? 'border-ember ring-2 ring-ember/15' : 'border-line focus:border-pine focus:ring-2 focus:ring-pine/15'
                }`}
                value={text}
                maxLength={400}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <Btn type="submit" disabled={busy} variant="primary" className="h-11 w-full">
              {stars >= 4 ? 'Continue to Google' : stars ? 'Send private feedback' : 'Select stars first'}
            </Btn>
          </form>
          {result?.route === 'google' ? (
            <a
              href={result.googleUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-pine"
            >
              Open Google Maps listing <ExternalLink size={14} />
            </a>
          ) : null}
          {result?.route === 'private' ? (
            <p className="mt-3 text-[13px] text-ember">Owner alert created. Public rating protected.</p>
          ) : null}
        </Surface>

        <div className="space-y-3">
          <Surface className="flex items-center gap-4 p-5">
            <img src={qrUrl} alt="Front desk review QR" className="h-[112px] w-[112px] border border-line bg-paper" />
            <div>
              <h3 className="font-display text-[1.3rem]">Front-desk QR</h3>
              <p className="mt-1 text-[13px] text-mute">
                Same funnel — never a raw Google link that lets 1-stars through.
              </p>
            </div>
          </Surface>
          <Surface className="p-5">
            <h3 className="font-display text-[1.3rem]">Negative shield</h3>
            <ul className="mt-3 space-y-3">
              {privateFlags.length === 0 ? (
                <li className="text-[13px] text-mute">No private flags. Submit 2 stars in the funnel.</li>
              ) : (
                privateFlags.map((f) => (
                  <li key={f.id} className="border border-line bg-canvas p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold">
                        {f.customer} · {f.stars}★
                      </p>
                      <span className="font-mono text-[10px] text-mute">{timeAgo(f.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[13px]">{f.reason}</p>
                    {f.status === 'open' ? (
                      <Btn variant="ghost" className="mt-2 h-8 text-[12px]" onClick={() => resolve(f.id)}>
                        Mark resolved
                      </Btn>
                    ) : (
                      <p className="mt-2 text-[12px] text-moss">Resolved</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </Surface>
        </div>
      </section>

      <Surface className="mt-3 p-5">
        <h2 className="font-display text-[1.3rem]">Published via funnel</h2>
        <ul className="mt-3 divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="text-[13px] font-semibold">
                  {r.customer} · {'★'.repeat(r.stars)}
                </p>
                <p className="text-[13px] text-mute">{r.text}</p>
              </div>
              <p className="font-mono text-[11px] text-mute">{formatWhen(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      </Surface>
    </PageShell>
  );
}
