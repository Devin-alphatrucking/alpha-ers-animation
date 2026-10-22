import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  CalendarCheck,
  ClipboardCheck,
  Copy,
  Eye,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  StickyNote,
  Star,
  ThumbsDown,
  Trash2,
  Trophy,
  Wand2
} from 'lucide-react';
import { api, timeAgo } from '../../api';
import { useDemo } from '../../context/DemoContext';
import { STAGES, followUpLabel, followUpState, isHot, nicheShort, trackedLink, viewedAgo } from '../../lib/prospects';
import { Badge, Btn, Drawer, Field, Segmented, Select, inputCls, useShake } from '../ui';

const QUICK = [
  { type: 'dm', label: 'DM sent', icon: Instagram, followUp: 3 },
  { type: 'email', label: 'Email sent', icon: Mail, followUp: 3 },
  { type: 'call', label: 'Called', icon: Phone, followUp: 2 },
  { type: 'reply', label: 'They replied', icon: MessageCircle, followUp: 1 },
  { type: 'demo', label: 'Demo booked', icon: CalendarCheck, followUp: 2 },
  { type: 'won', label: 'Won', icon: Trophy, followUp: '' },
  { type: 'lost', label: 'Lost', icon: ThumbsDown, followUp: '' }
];

const typeIcon = {
  note: StickyNote,
  dm: Instagram,
  email: Mail,
  call: Phone,
  reply: MessageCircle,
  demo: CalendarCheck,
  won: Trophy,
  lost: ThumbsDown,
  branded: Wand2,
  viewed: Eye,
  onboarding: ClipboardCheck
};

const FOLLOW_OPTIONS = [
  { value: '', label: 'None' },
  { value: '1', label: '1d' },
  { value: '3', label: '3d' },
  { value: '7', label: '1w' },
  { value: '14', label: '2w' }
];

export default function ProspectDetail({ prospect, onClose, onEdit }) {
  const { setProspects, showToast, brandForProspect } = useDemo();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [followUp, setFollowUp] = useState('3');
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shaker = useShake();

  useEffect(() => {
    setSelected(null);
    setNote('');
    setNoteError('');
    setConfirmDelete(false);
    setFollowUp('3');
  }, [prospect?.id]);

  if (!prospect) return <Drawer open={false} onClose={onClose} />;

  const p = prospect;
  const fu = followUpState(p);
  const closed = p.stage === 'won' || p.stage === 'lost';

  function pick(q) {
    setSelected(q.type === selected ? null : q.type);
    setFollowUp(q.followUp === '' ? '' : String(q.followUp));
    setNoteError('');
  }

  async function log() {
    const type = selected || 'note';
    const text = note.trim();
    if (type === 'note' && text.length < 2) {
      setNoteError('Write a short note or pick an action above');
      shaker.run();
      return;
    }
    if (text.length > 300) {
      setNoteError('Keep it under 300 characters');
      shaker.run();
      return;
    }
    setBusy('log');
    try {
      const res = await api.prospectActivity(p.id, { type, text, followUpDays: followUp });
      setProspects(res.prospects);
      setSelected(null);
      setNote('');
      showToast(type === 'note' ? 'Note saved' : `Logged · ${res.prospect.businessName} is now ${STAGES.find((s) => s.id === res.prospect.stage)?.label}`);
    } catch (err) {
      setNoteError(err.message);
      shaker.run();
    } finally {
      setBusy('');
    }
  }

  async function changeStage(stage) {
    if (stage === p.stage) return;
    try {
      const res = await api.updateProspect(p.id, { stage, ...(stage === 'won' || stage === 'lost' ? { nextFollowUp: null } : {}) });
      setProspects(res.prospects);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function brandDemo() {
    setBusy('brand');
    try {
      await brandForProspect(p);
      showToast(`Demo is now branded as ${p.businessName}`);
      onClose();
      navigate('/outreach');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy('');
    }
  }

  async function copyTracked() {
    try {
      await navigator.clipboard.writeText(trackedLink(p));
      showToast(`Tracked link for ${p.businessName} copied`);
    } catch {
      showToast('Couldn’t copy the link', 'error');
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy('delete');
    try {
      const res = await api.deleteProspect(p.id);
      setProspects(res.prospects);
      showToast(`${p.businessName} removed`);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy('');
    }
  }

  const contacts = [
    p.email && { icon: AtSign, label: p.email, href: `mailto:${p.email}` },
    p.instagram && { icon: Instagram, label: `@${p.instagram}`, href: `https://instagram.com/${p.instagram}` },
    p.phone && { icon: Phone, label: p.phone, href: `https://wa.me/${p.phone.replace(/\D/g, '')}` },
    p.website && { icon: Globe, label: p.website.replace(/^https?:\/\//, ''), href: p.website },
    p.mapsUrl && { icon: MapPin, label: `Google Maps${p.reviewCount ? ` · ${p.reviewCount} reviews` : ''}`, href: p.mapsUrl }
  ].filter(Boolean);

  return (
    <Drawer
      open
      onClose={onClose}
      kicker={`${nicheShort[p.nicheId] || p.nicheId} · ${p.city}${p.country ? `, ${p.country}` : ''}`}
      title={p.businessName}
      width={520}
      footer={
        <>
          <Btn variant={confirmDelete ? 'primary' : 'quiet'} onClick={remove} disabled={busy === 'delete'} className="mr-auto">
            <Trash2 size={14} />
            {confirmDelete ? 'Click again to delete' : 'Delete'}
          </Btn>
          <Btn variant="ghost" onClick={onEdit}>
            <Pencil size={14} />
            Edit details
          </Btn>
        </>
      }
    >
      <div className="space-y-6">
        <section data-stagger className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select value={p.stage} onChange={changeStage} options={STAGES.map((s) => ({ value: s.id, label: s.label }))} ariaLabel="Stage" />
          </div>
          {p.rating ? (
            <Badge>
              <Star size={11} className="mr-1 fill-current" />
              {p.rating}
            </Badge>
          ) : null}
          <Badge tone="pine">${p.dealValue ?? 0}/mo</Badge>
          {fu ? <Badge tone={fu === 'later' ? 'neutral' : 'ember'}>{followUpLabel(p)}</Badge> : null}
          {p.lastViewedAt ? (
            <Badge tone={isHot(p) ? 'pine' : 'neutral'}>
              <Eye size={11} className="mr-1" />
              Opened demo {p.views > 1 ? `${p.views}× · ` : ''}
              {viewedAgo(p)}
            </Badge>
          ) : null}
        </section>

        {contacts.length ? (
          <section data-stagger className="grid gap-1.5">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 truncate rounded-[6px] px-2 py-1.5 text-[13px] text-ink transition hover:bg-canvas"
              >
                <c.icon size={14} className="shrink-0 text-mute" />
                <span className="truncate">{c.label}</span>
              </a>
            ))}
          </section>
        ) : null}

        {p.notes ? (
          <p data-stagger className="rounded-[6px] border border-line bg-canvas/60 px-3 py-2.5 text-[13px] leading-relaxed text-ink/80">
            {p.notes}
          </p>
        ) : null}

        <section data-stagger className="rounded-[8px] border border-pine/20 bg-[#e8efe9] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-pine text-white">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">Brand the live demo for {p.ownerName || 'this owner'}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-mute">
                Loads {p.businessName}, {p.city} and {p.currencyCode} pricing into the demo, then opens your pitch scripts.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="pine" size="sm" onClick={brandDemo} disabled={busy === 'brand'}>
                  <Wand2 size={13} />
                  {busy === 'brand' ? 'Branding…' : 'Brand demo & open scripts'}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={copyTracked}>
                  <Copy size={13} />
                  Copy tracked link
                </Btn>
              </div>
              <p className="mt-2 text-[11px] text-mute">
                {p.lastViewedAt ? `Opened ${p.views || 1}× so far. ` : ''}Opens from this link show up in the timeline below.
              </p>
            </div>
          </div>
        </section>

        <section data-stagger ref={shaker.ref} className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Log activity</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => {
              const on = selected === q.type;
              if (closed && q.type === p.stage) return null;
              return (
                <button
                  key={q.type}
                  type="button"
                  onClick={() => pick(q)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ${
                    on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-ink hover:border-[#c9bfac] hover:bg-canvas'
                  }`}
                >
                  <q.icon size={13} />
                  {q.label}
                </button>
              );
            })}
          </div>
          <Field error={noteError} hint={selected ? 'Optional detail' : 'Pick an action, or just write a note'}>
            <textarea
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (noteError) setNoteError('');
              }}
              placeholder={selected === 'reply' ? 'What did they say?' : selected === 'lost' ? 'Why not? (e.g. already on Podium)' : 'Add a note…'}
              className={`${inputCls(noteError)} h-auto resize-none py-2.5 leading-relaxed`}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[12px] text-mute">
              Follow up in
              <Segmented value={followUp} onChange={setFollowUp} options={FOLLOW_OPTIONS} />
            </div>
            <Btn size="sm" variant="ink" onClick={log} disabled={busy === 'log'}>
              {busy === 'log' ? 'Saving…' : selected ? `Log “${QUICK.find((q) => q.type === selected).label}”` : 'Save note'}
            </Btn>
          </div>
        </section>

        <section data-stagger>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">Timeline</p>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {p.activity.map((a) => {
              const Icon = typeIcon[a.type] || StickyNote;
              const strong = ['won', 'demo', 'reply', 'viewed'].includes(a.type);
              return (
                <li key={a.id} className="relative">
                  <span
                    className={`absolute -left-[31px] grid h-[21px] w-[21px] place-items-center rounded-full border ${
                      a.type === 'won'
                        ? 'border-moss bg-moss text-white'
                        : a.hot
                          ? 'border-ember/40 bg-[#f6e3d8] text-ember'
                          : strong
                            ? 'border-pine/30 bg-[#e3ece5] text-pine' : 'border-line bg-paper text-mute'
                    }`}
                  >
                    <Icon size={11} />
                  </span>
                  <p className="text-[13px] leading-snug text-ink">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-mute">{timeAgo(a.at)}</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </Drawer>
  );
}
