import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, BatteryFull, ChevronLeft, Globe, Instagram, MapPin, PhoneMissed, Send, Signal, Sparkles, Wifi } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { api, formatMoney, timeAgo } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { popIn } from '../lib/motion';
import { trackAction } from '../lib/track';
import { Avatar } from '../components/Brand';
import { Btn, PageShell, Segmented, Surface, inputCls, useShake } from '../components/ui';

const channelMeta = {
  instagram: { label: 'Instagram', icon: Instagram, tone: 'text-[#6D28D9] bg-[#F3EEFD]' },
  sms: { label: 'SMS', icon: PhoneMissed, tone: 'text-emberDeep bg-emberSoft' },
  web: { label: 'Website', icon: Globe, tone: 'text-[#1D4ED8] bg-[#EAF1FE]' },
  google: { label: 'Google', icon: MapPin, tone: 'text-pine bg-pineSoft' }
};

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[12px] font-semibold text-ink">
      <span className="tabular">9:41</span>
      <span className="flex items-center gap-1">
        <Signal size={13} strokeWidth={2.5} />
        <Wifi size={13} strokeWidth={2.5} />
        <BatteryFull size={17} strokeWidth={2} />
      </span>
    </div>
  );
}

function PhoneShell({ name, instagram, scrollRef, children, footer }) {
  return (
    <div className="relative mx-auto w-[318px] rounded-[52px] bg-[#1B1C1F] p-[10px] shadow-[0_0_0_1.5px_#3A3B40,0_30px_60px_-20px_rgba(13,14,16,0.45),0_12px_24px_-12px_rgba(13,14,16,0.3)]">
      <span className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l bg-[#2A2B30]" />
      <span className="absolute -left-[3px] top-[160px] h-12 w-[3px] rounded-l bg-[#2A2B30]" />
      <span className="absolute -right-[3px] top-[140px] h-16 w-[3px] rounded-r bg-[#2A2B30]" />
      <div className="relative overflow-hidden rounded-[42px] bg-white">
        <div className="absolute left-1/2 top-[10px] z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <StatusBar />
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#F9F9F9]/90 px-3 pb-2.5 pt-4">
          <ChevronLeft size={22} className="text-imessage" />
          <div className="flex flex-1 flex-col items-center">
            <div className="relative">
              <Avatar name={name} size={34} />
              {instagram ? (
                <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] ring-2 ring-[#F9F9F9]">
                  <Instagram size={8} className="text-white" />
                </span>
              ) : null}
            </div>
            <p className="mt-1 flex items-center gap-0.5 text-[11px] font-medium text-ink">
              {name} <ChevronLeft size={10} className="rotate-180 text-mute" />
            </p>
          </div>
          <span className="w-[22px]" />
        </div>
        <div ref={scrollRef} className="h-[392px] space-y-1.5 overflow-y-auto px-3 py-3 scrollbar-thin">{children}</div>
        {footer}
        <div className="flex justify-center pb-2 pt-1">
          <span className="h-[5px] w-[120px] rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}

function PhoneBubble({ msg, instagram }) {
  if (msg.from === 'system') {
    return <p className="py-1 text-center text-[10px] font-medium text-[#8E8E93]">{msg.text}</p>;
  }
  const mine = msg.from === 'customer';
  const sent = instagram ? 'bg-gradient-to-br from-[#7B3FE4] to-[#C13584] text-white' : 'bg-imessage text-white';
  return (
    <div data-bubble className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-[18px] px-3 py-[7px] text-[13px] leading-[1.32] ${
          mine ? `${sent} rounded-br-[5px]` : 'rounded-bl-[5px] bg-[#E9E9EB] text-black'
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="typing flex gap-1 rounded-[18px] rounded-bl-[5px] bg-[#E9E9EB] px-3.5 py-3 text-[#8E8E93]">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function ThreadBubble({ msg }) {
  if (msg.from === 'system') {
    return (
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-line" />
        <p className="font-mono text-[10px] uppercase tracking-wide text-mute">{msg.text}</p>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  const desk = msg.from !== 'customer';
  return (
    <div className={`flex ${desk ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] ${desk ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-[12px] px-3 py-2 text-left text-[13px] leading-snug ${
            desk ? 'rounded-br-[4px] bg-ink text-white' : 'rounded-bl-[4px] border border-line bg-paper text-ink shadow-card'
          }`}
        >
          {msg.text}
        </div>
        {desk && msg.from === 'ai' ? (
          <p className="mt-1 flex items-center justify-end gap-1 font-mono text-[10px] text-mute">
            <Sparkles size={10} className="text-ember" /> Sent by desk
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function InboxSimulator() {
  const { state, setState, showToast } = useDemo();
  const { business: b, leads } = state;
  const location = useLocation();
  const navigate = useNavigate();
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
  const simScroll = useRef(null);
  const lastSimulate = useRef(null);

  const visible = useMemo(
    () => (filter === 'all' ? leads : leads.filter((l) => l.channel === filter)),
    [leads, filter]
  );
  const active = leads.find((l) => l.id === activeId) || visible[0] || leads[0];
  const simLead = leads.find((l) => l.id === state.simulator?.leadId);
  const simMessages = simLead?.messages || state.simulator?.messages || [];
  const instagram = simMode === 'instagram';

  useGSAP(() => {
    const nodes = simRef.current?.querySelectorAll('[data-bubble]');
    if (!nodes?.length) return;
    popIn(nodes[nodes.length - 1]);
  }, { dependencies: [simMessages.length] });

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [active?.id, active?.messages?.length]);

  useEffect(() => {
    if (simScroll.current) simScroll.current.scrollTop = simScroll.current.scrollHeight;
  }, [simMessages.length, busy]);

  useEffect(() => {
    const token = location.state?.simulate;
    if (!token || lastSimulate.current === token) return;
    lastSimulate.current = token;
    navigate(location.pathname, { replace: true, state: null });
    runMissedCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  async function runMissedCall() {
    setBusy(true);
    try {
      const next = await api.missedCall('Alex Rivera');
      setState(next);
      trackAction('missed_call');
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
      trackAction('instagram');
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
      const { state: next, reply } = await api.chat(simInput.trim(), simMode);
      setState(next);
      trackAction('chat');
      if (typeof reply === 'string' && reply.startsWith('Booked')) trackAction('booking');
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

  const activeMeta = active ? channelMeta[active.channel] : null;

  return (
    <PageShell
      kicker="Unified inbox"
      title="Lead catcher"
      subtitle={`Instagram, missed calls, website and Google, all answered as ${b.name} in seconds.`}
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
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_370px]">
        <Surface className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold tracking-[-0.01em]">Conversations</h2>
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
          <div className="grid min-h-[560px] md:grid-cols-[232px_minmax(0,1fr)]">
            <ul className="max-h-[560px] overflow-y-auto border-r border-line p-1.5 scrollbar-thin">
              {visible.map((lead) => {
                const meta = channelMeta[lead.channel];
                const Icon = meta.icon;
                const on = active?.id === lead.id;
                return (
                  <li key={lead.id}>
                    <button
                      onClick={() => setActiveId(lead.id)}
                      className={`flex w-full gap-2.5 rounded-[9px] px-2.5 py-2.5 text-left transition ${
                        on ? 'bg-ink/[0.05]' : 'hover:bg-ink/[0.025]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar name={lead.name} size={32} />
                        <span className={`absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-paper ${meta.tone}`}>
                          <Icon size={9} strokeWidth={2.5} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-[13px] ${lead.unread ? 'font-semibold' : 'font-medium'}`}>{lead.name}</p>
                          <span className="shrink-0 font-mono text-[10px] text-mute">{timeAgo(lead.createdAt)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="truncate text-[12px] text-mute">{lead.preview}</p>
                          {lead.unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" /> : null}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex min-h-[560px] flex-col">
              {active ? (
                <>
                  <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                    <Avatar name={active.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{active.name}</p>
                      <p className="truncate text-[12px] text-mute">
                        {active.phone} · {active.service} · {active.value ? formatMoney(active.value, b.currency) : 'Consult'}
                      </p>
                    </div>
                    <span className={`hidden items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium sm:inline-flex ${activeMeta.tone}`}>
                      <activeMeta.icon size={11} /> {activeMeta.label}
                    </span>
                    <span className="hidden items-center gap-1.5 rounded-[6px] border border-line px-2 py-1 text-[11px] font-medium text-ink 2xl:inline-flex">
                      <span className="h-1.5 w-1.5 rounded-full bg-moss text-moss live-dot" /> Desk handling
                    </span>
                  </div>
                  <div ref={threadRef} className="dot-grid flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-4 scrollbar-thin">
                    {active.messages.map((m) => (
                      <ThreadBubble key={m.id} msg={m} />
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
                    {composerErr ? (
                      <p className="mt-1 text-[12px] text-ember">{composerErr}</p>
                    ) : (
                      <p className="mt-1 font-mono text-[10px] text-mute">{composer.trim().length}/400 · the desk answers instantly</p>
                    )}
                  </form>
                </>
              ) : (
                <p className="m-auto text-sm text-mute">No conversations yet.</p>
              )}
            </div>
          </div>
        </Surface>

        <Surface className="relative overflow-hidden p-5">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Customer's phone</p>
                <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.02em]">Try it as the customer</h2>
                <p className="mt-0.5 text-[12px] text-mute">Ask “how much?”, then “yes book it”.</p>
              </div>
              <Segmented
                value={simMode}
                onChange={setSimMode}
                options={[
                  { value: 'sms', label: 'SMS' },
                  { value: 'instagram', label: 'IG' }
                ]}
              />
            </div>
            <div ref={simRef}>
              <PhoneShell
                name={b.name}
                instagram={instagram}
                scrollRef={simScroll}
                footer={
                  <form ref={phoneShake.ref} onSubmit={sendSim} className="px-2.5 pb-1 pt-2">
                    <div className={`flex items-center gap-1 rounded-full border bg-white py-1 pl-3.5 pr-1 ${simErr ? 'border-ember' : 'border-[#D1D1D6]'}`}>
                      <input
                        className="h-7 w-full bg-transparent text-[13px] outline-none placeholder:text-[#8E8E93]"
                        placeholder={instagram ? 'Message…' : 'iMessage'}
                        value={simInput}
                        maxLength={280}
                        onChange={(e) => {
                          setSimInput(e.target.value);
                          if (simErr) setSimErr(v.message(e.target.value, { min: 1, max: 280, label: 'Reply' }));
                        }}
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        aria-label="Send"
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white transition disabled:opacity-50 ${
                          instagram ? 'bg-gradient-to-br from-[#7B3FE4] to-[#C13584]' : 'bg-imessage'
                        }`}
                      >
                        <ArrowUp size={15} strokeWidth={2.75} />
                      </button>
                    </div>
                    {simErr ? <p className="mt-1 px-2 text-[11px] text-ember">{simErr}</p> : null}
                  </form>
                }
              >
                {simMessages.length === 0 && !busy ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-emberSoft text-ember">
                      <PhoneMissed size={18} />
                    </span>
                    <p className="mt-3 text-[13px] font-semibold text-black">Call {b.name} and hang up</p>
                    <p className="mt-1 text-[12px] leading-snug text-[#8E8E93]">Press “Simulate missed call”. The desk texts back before you put the phone down.</p>
                  </div>
                ) : (
                  <>
                    <p className="pb-1 text-center text-[10px] font-medium text-[#8E8E93]">{instagram ? 'Instagram · Today' : 'Text Message · Today 9:41'}</p>
                    {simMessages.map((m) => (
                      <PhoneBubble key={m.id} msg={m} instagram={instagram} />
                    ))}
                    {busy ? <Typing /> : null}
                  </>
                )}
              </PhoneShell>
            </div>
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
