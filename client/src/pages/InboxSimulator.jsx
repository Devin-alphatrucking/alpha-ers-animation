import { useEffect, useMemo, useRef, useState } from 'react';
import { Instagram, PhoneMissed, Send, Globe, MapPin } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { api, formatMoney, timeAgo } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { popIn } from '../lib/motion';
import { Btn, PageShell, Segmented, Surface, inputCls, useShake } from '../components/ui';

const channelMeta = {
  instagram: { label: 'Instagram', icon: Instagram },
  sms: { label: 'SMS', icon: PhoneMissed },
  web: { label: 'Website', icon: Globe },
  google: { label: 'Google', icon: MapPin }
};

function PhoneShell({ title, children, footer }) {
  return (
    <div className="mx-auto w-[300px] rounded-[28px] border-[8px] border-ink bg-ink">
      <div className="overflow-hidden rounded-[20px] bg-[#efe8d8]">
        <div className="flex justify-center bg-ink">
          <div className="phone-notch" />
        </div>
        <div className="flex items-center justify-between bg-[#1c3d34] px-4 py-2 text-[#f4efe4]">
          <p className="truncate text-[11px] font-medium">{title}</p>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#d7e8c8]">Live</span>
        </div>
        <div className="h-[400px] space-y-2 overflow-y-auto p-3 scrollbar-thin">{children}</div>
        {footer}
      </div>
    </div>
  );
}

function Bubble({ msg }) {
  if (msg.from === 'system') {
    return <p className="text-center font-mono text-[10px] text-mute">{msg.text}</p>;
  }
  const mine = msg.from === 'customer';
  return (
    <div data-bubble className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] px-3 py-2 text-[12.5px] leading-snug ${
          mine ? 'bg-ink text-paper' : 'border border-line bg-paper text-ink'
        }`}
      >
        {!mine && msg.from === 'ai' ? (
          <p className="mb-0.5 font-mono text-[9px] uppercase tracking-wider text-pine">Desk</p>
        ) : null}
        {msg.text}
      </div>
    </div>
  );
}

export default function InboxSimulator() {
  const { state, setState, showToast } = useDemo();
  const { business: b, leads } = state;
  const [activeId, setActiveId] = useState(leads[0]?.id || null);
  const [filter, setFilter] = useState('all');
  const [composer, setComposer] = useState('');
  const [simInput, setSimInput] = useState('');
  const [composerErr, setComposerErr] = useState('');
  const [simErr, setSimErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [simMode, setSimMode] = useState('sms');
  const phoneShake = useShake();
  const inboxShake = useShake();
  const threadRef = useRef(null);
  const simRef = useRef(null);

  const visible = useMemo(
    () => (filter === 'all' ? leads : leads.filter((l) => l.channel === filter)),
    [leads, filter]
  );
  const active = leads.find((l) => l.id === activeId) || visible[0] || leads[0];
  const simLead = leads.find((l) => l.id === state.simulator?.leadId);
  const simMessages = simLead?.messages || state.simulator?.messages || [];

  useGSAP(() => {
    const nodes = simRef.current?.querySelectorAll('[data-bubble]');
    if (!nodes?.length) return;
    popIn(nodes[nodes.length - 1]);
  }, { dependencies: [simMessages.length] });

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [active?.messages?.length]);

  async function runMissedCall() {
    setBusy(true);
    try {
      const next = await api.missedCall('Alex Rivera');
      setState(next);
      setSimMode('sms');
      if (next.simulator?.leadId) setActiveId(next.simulator.leadId);
      showToast('Missed call recovered in 8 seconds');
    } finally {
      setBusy(false);
    }
  }

  async function runInstagram() {
    setBusy(true);
    try {
      const next = await api.instagram('jordan.styles');
      setState(next);
      setSimMode('instagram');
      if (next.simulator?.leadId) setActiveId(next.simulator.leadId);
      showToast('Instagram DM quoted live pricing');
    } finally {
      setBusy(false);
    }
  }

  async function sendSim(e) {
    e.preventDefault();
    const err = v.message(simInput, { min: 1, max: 280, label: 'Reply' });
    setSimErr(err);
    if (err) {
      phoneShake.run();
      showToast(err, 'error');
      return;
    }
    setBusy(true);
    try {
      const { state: next } = await api.chat(simInput.trim(), simMode);
      setState(next);
      setSimInput('');
      if (next.simulator?.leadId) setActiveId(next.simulator.leadId);
    } finally {
      setBusy(false);
    }
  }

  async function sendOnLead(e) {
    e.preventDefault();
    const err = v.message(composer, { min: 2, max: 400, label: 'Message' });
    setComposerErr(err);
    if (err || !active) {
      inboxShake.run();
      showToast(err || 'Pick a conversation', 'error');
      return;
    }
    setBusy(true);
    try {
      const { state: next } = await api.leadAi(active.id, composer.trim());
      setState(next);
      setComposer('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      kicker="Unified inbox"
      title="Lead catcher"
      subtitle={`Instagram, missed calls, website and Google — answered as ${b.name}.`}
      actions={
        <>
          <Btn variant="primary" disabled={busy} onClick={runMissedCall}>
            <PhoneMissed size={15} /> Simulate missed call
          </Btn>
          <Btn variant="ghost" disabled={busy} onClick={runInstagram}>
            <Instagram size={15} /> Test Instagram
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold">Conversations</h2>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={['all', 'sms', 'instagram', 'web', 'google'].map((key) => ({
                value: key,
                label: key === 'all' ? 'All' : channelMeta[key].label,
                count: key === 'all' ? leads.length : leads.filter((l) => l.channel === key).length
              }))}
            />
          </div>
          <div className="grid min-h-[520px] md:grid-cols-[220px_1fr]">
            <ul className="max-h-[520px] overflow-y-auto border-r border-line scrollbar-thin">
              {visible.map((lead) => {
                const meta = channelMeta[lead.channel];
                const Icon = meta.icon;
                const on = active?.id === lead.id;
                return (
                  <li key={lead.id}>
                    <button
                      onClick={() => setActiveId(lead.id)}
                      className={`w-full border-b border-line px-3 py-3 text-left ${on ? 'bg-canvas' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold">{lead.name}</p>
                        <span className="font-mono text-[10px] text-mute">{timeAgo(lead.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-mute">{lead.preview}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-pine">
                        <Icon size={10} /> {meta.label}
                        {lead.unread ? <span className="h-1.5 w-1.5 rounded-full bg-ember" /> : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex min-h-[520px] flex-col">
              {active ? (
                <>
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-[14px] font-semibold">{active.name}</p>
                    <p className="text-[12px] text-mute">
                      {active.phone} · {active.service} · {active.value ? formatMoney(active.value, b.currency) : 'Consult'}
                    </p>
                  </div>
                  <div ref={threadRef} className="flex-1 space-y-2 overflow-y-auto bg-canvas/50 p-4 scrollbar-thin">
                    {active.messages.map((m) => (
                      <Bubble key={m.id} msg={m} />
                    ))}
                  </div>
                  <form ref={inboxShake.ref} onSubmit={sendOnLead} className="border-t border-line p-3">
                    <div className="flex gap-2">
                      <input
                        className={inputCls(composerErr)}
                        placeholder={`Reply as a customer of ${b.name}`}
                        value={composer}
                        maxLength={400}
                        onChange={(e) => {
                          setComposer(e.target.value);
                          if (composerErr) setComposerErr(v.message(e.target.value, { min: 2, max: 400, label: 'Message' }));
                        }}
                      />
                      <Btn type="submit" variant="ink" disabled={busy} className="shrink-0">
                        <Send size={14} /> Send
                      </Btn>
                    </div>
                    {composerErr ? <p className="mt-1 text-[12px] text-ember">{composerErr}</p> : (
                      <p className="mt-1 text-[11px] text-mute">{composer.trim().length}/400</p>
                    )}
                  </form>
                </>
              ) : (
                <p className="m-auto text-sm text-mute">No conversations yet.</p>
              )}
            </div>
          </div>
        </Surface>

        <Surface className="p-5">
          <h2 className="font-display text-[1.35rem]">Phone — demo closer</h2>
          <p className="mb-4 text-[12px] text-mute">Type as the customer. The desk quotes {b.name} prices.</p>
          <div ref={simRef}>
            <PhoneShell
              title={simMode === 'instagram' ? `${b.name} · IG` : `${b.name} · SMS`}
              footer={
                <form ref={phoneShake.ref} onSubmit={sendSim} className="border-t border-line bg-paper p-2">
                  <div className="flex gap-1">
                    <input
                      className={`h-9 w-full rounded-full border bg-canvas px-3.5 text-[12.5px] outline-none transition placeholder:text-mute/60 ${
                        simErr ? 'border-ember' : 'border-transparent focus:border-pine'
                      }`}
                      placeholder="Customer reply"
                      value={simInput}
                      maxLength={280}
                      onChange={(e) => {
                        setSimInput(e.target.value);
                        if (simErr) setSimErr(v.message(e.target.value, { min: 1, max: 280, label: 'Reply' }));
                      }}
                    />
                    <Btn type="submit" variant="ink" disabled={busy} className="h-9 w-9 shrink-0 rounded-full p-0">
                      <Send size={13} />
                    </Btn>
                  </div>
                  {simErr ? <p className="mt-1 px-2 text-[11px] text-ember">{simErr}</p> : null}
                </form>
              }
            >
              {simMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <p className="text-[13px] font-medium">Hit Simulate missed call</p>
                  <p className="mt-1 text-[12px] text-mute">Then try “how much?” and “yes book it”.</p>
                </div>
              ) : (
                simMessages.map((m) => <Bubble key={m.id} msg={m} />)
              )}
            </PhoneShell>
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
