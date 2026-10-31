import { useCallback, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { AlarmClock, AtSign, Eye, Flame, Instagram, LayoutGrid, Plus, Rows3, Search, Star, Upload, X } from 'lucide-react';
import { api, timeAgo } from '../api';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import {
  OPEN_STAGES,
  STAGES,
  followUpLabel,
  followUpState,
  isBuying,
  isDue,
  isHot,
  nicheShort,
  stageLabel,
  viewedAgo
} from '../lib/prospects';
import { Avatar } from '../components/Brand';
import { Badge, Btn, Count, PageShell, Segmented, Select, Surface } from '../components/ui';
import ProspectForm from '../components/prospects/ProspectForm';
import ProspectDetail from '../components/prospects/ProspectDetail';
import ImportDialog from '../components/prospects/ImportDialog';

function FollowChip({ p }) {
  const s = followUpState(p);
  if (!s) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        s === 'later' ? 'bg-ink/[0.04] text-mute' : s === 'today' ? 'bg-emberSoft text-emberDeep' : 'bg-emberSoft text-emberDeep ring-1 ring-inset ring-ember/30'
      }`}
    >
      <AlarmClock size={11} />
      {followUpLabel(p)}
    </span>
  );
}

function ViewedChip({ p }) {
  if (!p.lastViewedAt) return null;
  const hot = isHot(p);
  return (
    <span
      title={`Opened your demo ${p.views || 1}×`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        hot ? 'bg-pineSoft text-pine' : 'bg-canvas text-mute'
      }`}
    >
      {hot ? <span className="h-1.5 w-1.5 rounded-full bg-moss live-dot" /> : <Eye size={11} />}
      Viewed {viewedAgo(p)}
      {p.views > 1 ? <span className="font-mono text-[10px] opacity-70">×{p.views}</span> : null}
    </span>
  );
}

function Card({ p, onOpen, onDragStart, dragging }) {
  const overdue = followUpState(p) === 'overdue';
  return (
    <button
      type="button"
      draggable
      data-card
      onDragStart={(e) => onDragStart(e, p)}
      onClick={() => onOpen(p.id)}
      className={`group w-full rounded-[10px] border border-line bg-paper p-3 text-left shadow-card transition hover:-translate-y-[1px] hover:border-lineStrong hover:shadow-lift ${
        overdue ? 'border-l-2 border-l-ember' : ''
      } ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={p.businessName} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">{p.businessName}</p>
          <p className="mt-0.5 truncate text-[12px] text-mute">
            {nicheShort[p.nicheId]} · {p.city}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-mute">
        {p.email ? <AtSign size={12} /> : null}
        {p.instagram ? <Instagram size={12} /> : null}
        {p.rating ? (
          <span className="inline-flex items-center gap-0.5 font-mono text-[11px]">
            <Star size={10} className="fill-current" />
            {p.rating}
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[11px] text-ink/70">${p.dealValue ?? 0}/mo</span>
      </div>
      {followUpState(p) || p.lastViewedAt ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <ViewedChip p={p} />
          <FollowChip p={p} />
        </div>
      ) : null}
    </button>
  );
}

export default function Prospects() {
  const { prospects, setProspects, refreshProspects, niches, showToast } = useDemo();
  const [view, setView] = useState(() => window.localStorage.getItem('pl_pipeline_view') || 'board');
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState('all');
  const [dueOnly, setDueOnly] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ open: false, prospect: null });
  const [importOpen, setImportOpen] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const listRef = useRef(null);

  const stats = useMemo(() => {
    const open = prospects.filter((p) => OPEN_STAGES.includes(p.stage));
    const won = prospects.filter((p) => p.stage === 'won');
    const contacted = prospects.filter((p) => p.stage !== 'new').length;
    const replied = prospects.filter((p) => ['replied', 'demo', 'won'].includes(p.stage)).length;
    return {
      total: prospects.length,
      open: open.length,
      pipelineValue: open.reduce((s, p) => s + (p.dealValue || 0), 0),
      demos: prospects.filter((p) => p.stage === 'demo').length,
      wonMrr: won.reduce((s, p) => s + (p.dealValue || 0), 0),
      wonCount: won.length,
      replyRate: contacted ? Math.round((replied / contacted) * 100) : 0,
      due: prospects.filter(isDue),
      opened: prospects.filter((p) => p.lastViewedAt).length,
      hot: prospects.filter(isHot).sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt)),
      buying: prospects.filter(isBuying).sort((a, b) => new Date(b.buyingSignalAt) - new Date(a.buyingSignalAt))
    };
  }, [prospects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects.filter((p) => {
      if (niche !== 'all' && p.nicheId !== niche) return false;
      if (dueOnly && !isDue(p)) return false;
      if (!q) return true;
      return [p.businessName, p.city, p.country, p.ownerName, p.email, p.instagram].some((f) => (f || '').toLowerCase().includes(q));
    });
  }, [prospects, query, niche, dueOnly]);

  useGSAP(
    () => {
      const cards = listRef.current?.querySelectorAll('[data-card]');
      if (cards?.length) gsap.fromTo(cards, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.02, ease: 'power2.out' });
    },
    { scope: listRef, dependencies: [view, niche, dueOnly] }
  );

  const switchView = (v) => {
    setView(v);
    window.localStorage.setItem('pl_pipeline_view', v);
  };

  const onDragStart = useCallback((e, p) => {
    e.dataTransfer.setData('text/plain', p.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragId(p.id);
  }, []);

  async function moveTo(id, stage) {
    setDragId(null);
    setOverStage(null);
    const p = prospects.find((x) => x.id === id);
    if (!p || p.stage === stage) return;
    const closing = stage === 'won' || stage === 'lost';
    setProspects((list) => list.map((x) => (x.id === id ? { ...x, stage, ...(closing ? { nextFollowUp: null } : {}) } : x)));
    try {
      const res = await api.updateProspect(id, { stage, ...(closing ? { nextFollowUp: null } : {}) });
      setProspects(res.prospects);
      showToast(`${p.businessName} → ${stageLabel(stage)}`);
    } catch (err) {
      showToast(err.message, 'error');
      refreshProspects().catch(() => {});
    }
  }

  const openProspect = prospects.find((p) => p.id === openId) || null;
  const nicheOptions = [{ value: 'all', label: 'All industries' }, ...niches.map((n) => ({ value: n.id, label: n.label }))];
  const hasFilters = query || niche !== 'all' || dueOnly;

  return (
    <PageShell
      kicker="Your sales"
      title="Pipeline"
      subtitle="Every business you pitch, from first DM to signed. Log touches in one click and never miss a follow-up."
      actions={
        <>
          <Btn variant="ghost" onClick={() => setImportOpen(true)}>
            <Upload size={14} />
            Import CSV
          </Btn>
          <Btn onClick={() => setForm({ open: true, prospect: null })}>
            <Plus size={15} />
            Add prospect
          </Btn>
        </>
      }
    >
      <Surface className="mb-5 grid grid-cols-2 divide-line md:grid-cols-5 md:divide-x">
        {[
          { label: 'Prospects', value: stats.total, sub: `${stats.open} in play · ${stats.opened} opened demo` },
          { label: 'Open pipeline', value: stats.pipelineValue, prefix: '$', suffix: '/mo', sub: 'If every open deal signs' },
          { label: 'Reply rate', value: stats.replyRate, suffix: '%', sub: `${stats.demos} demo${stats.demos === 1 ? '' : 's'} booked` },
          { label: 'Won MRR', value: stats.wonMrr, prefix: '$', sub: `${stats.wonCount} paying client${stats.wonCount === 1 ? '' : 's'}`, accent: true },
          { label: 'Follow-ups due', value: stats.due.length, sub: stats.due.length ? 'Today or overdue' : 'All caught up', warn: stats.due.length > 0 }
        ].map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">{s.label}</p>
            <p className={`mt-1.5 font-display text-[1.7rem] leading-none ${s.warn ? 'text-ember' : s.accent ? 'text-moss' : 'text-ink'}`}>
              <Count value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-1.5 text-[12px] text-mute">{s.sub}</p>
          </div>
        ))}
      </Surface>

      {stats.buying.length ? (
        <div data-reveal className="mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-ember/40 bg-emberSoft px-4 py-3">
          <Flame size={15} className="text-ember" />
          <p className="mr-1 text-[13px] font-semibold text-ink">Ready to buy:</p>
          {stats.buying.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-ember/30 bg-paper px-3 text-[12px] font-medium text-ink transition hover:border-ember"
            >
              {p.businessName}
              <span className="font-mono text-[10px] text-mute">{timeAgo(p.buyingSignalAt)}</span>
            </button>
          ))}
          <span className="ml-auto hidden text-[12px] text-mute lg:inline">Clicked Pay, booked a call or reserved. Reach out now.</span>
        </div>
      ) : null}

      {stats.hot.length ? (
        <div data-reveal className="mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-pine/25 bg-pineSoft px-4 py-3">
          <Eye size={15} className="text-pine" />
          <p className="mr-1 text-[13px] font-semibold text-ink">Just opened your demo:</p>
          {stats.hot.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-pine/25 bg-paper px-3 text-[12px] font-medium text-ink transition hover:border-pine"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-moss live-dot" />
              {p.businessName}
              <span className="font-mono text-[10px] text-mute">{viewedAgo(p)}</span>
            </button>
          ))}
          <span className="ml-auto hidden text-[12px] text-mute lg:inline">Message them while it’s fresh.</span>
        </div>
      ) : null}

      {stats.due.length ? (
        <div data-reveal className="mb-5 flex flex-wrap items-center gap-2 rounded-[8px] border border-ember/25 bg-emberSoft px-4 py-3">
          <AlarmClock size={15} className="text-ember" />
          <p className="mr-1 text-[13px] font-semibold text-ink">Follow up today:</p>
          {stats.due.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpenId(p.id)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-ember/25 bg-paper px-3 text-[12px] font-medium text-ink transition hover:border-ember"
            >
              {p.businessName}
              <span className={`font-mono text-[10px] ${followUpState(p) === 'overdue' ? 'text-ember' : 'text-mute'}`}>{followUpLabel(p).replace('Follow up ', '')}</span>
            </button>
          ))}
          {stats.due.length > 5 ? (
            <button type="button" className="text-[12px] font-medium text-ember underline-offset-2 hover:underline" onClick={() => setDueOnly(true)}>
              +{stats.due.length - 5} more
            </button>
          ) : null}
        </div>
      ) : null}

      <div data-reveal className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={query}
            maxLength={60}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search business, city, owner, @handle"
            className="h-9 w-full rounded-[6px] border border-line bg-paper pl-8 pr-8 text-[13px] text-ink outline-none transition placeholder:text-mute/60 hover:border-lineStrong focus:border-pine focus:ring-2 focus:ring-pine/15"
          />
          {query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-mute hover:text-ink">
              <X size={14} />
            </button>
          ) : null}
        </div>
        <div className="w-48">
          <Select value={niche} onChange={setNiche} options={nicheOptions} ariaLabel="Filter by industry" className="[&>button]:h-9" />
        </div>
        <button
          type="button"
          onClick={() => setDueOnly((d) => !d)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-[6px] border px-3 text-[12px] font-medium transition ${
            dueOnly ? 'border-ember bg-ember text-white' : 'border-line bg-paper text-ink hover:border-lineStrong'
          }`}
        >
          <AlarmClock size={13} />
          Due only
        </button>
        {hasFilters ? (
          <Btn
            variant="quiet"
            size="sm"
            onClick={() => {
              setQuery('');
              setNiche('all');
              setDueOnly(false);
            }}
          >
            Clear filters
          </Btn>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-mute">
            {filtered.length} of {prospects.length}
          </span>
          <div className="inline-flex rounded-[7px] border border-line bg-canvas p-0.5">
            {[
              { id: 'board', icon: LayoutGrid, label: 'Board' },
              { id: 'table', icon: Rows3, label: 'Table' }
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => switchView(v.id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12px] font-medium transition ${
                  view === v.id ? 'bg-paper text-ink shadow-[0_1px_2px_rgba(23,21,15,0.08)]' : 'text-mute hover:text-ink'
                }`}
              >
                <v.icon size={13} />
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={listRef} data-reveal>
        {prospects.length === 0 ? (
          <Surface reveal={false} className="grid place-items-center px-6 py-16 text-center">
            <p className="font-display text-[1.4rem] text-ink">Your pipeline is empty</p>
            <p className="mt-1 max-w-sm text-[13px] text-mute">Add the first business you want to pitch, or import a list you scraped from Google Maps.</p>
            <div className="mt-4 flex gap-2">
              <Btn variant="ghost" onClick={() => setImportOpen(true)}>
                Import CSV
              </Btn>
              <Btn onClick={() => setForm({ open: true, prospect: null })}>Add prospect</Btn>
            </div>
          </Surface>
        ) : view === 'board' ? (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 scrollbar-thin">
            {STAGES.map((stage) => {
              const items = filtered.filter((p) => p.stage === stage.id);
              const value = items.reduce((s, p) => s + (p.dealValue || 0), 0);
              const over = overStage === stage.id;
              return (
                <section
                  key={stage.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (overStage !== stage.id) setOverStage(stage.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) setOverStage(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    moveTo(e.dataTransfer.getData('text/plain'), stage.id);
                  }}
                  className={`flex w-[244px] shrink-0 flex-col rounded-[9px] border p-2 transition ${
                    over ? 'border-pine/50 bg-pineSoft' : 'border-transparent bg-ink/[0.03]'
                  }`}
                >
                  <header className="flex items-center gap-2 px-1.5 pb-2 pt-1">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    <h3 className="text-[12px] font-semibold text-ink">{stage.label}</h3>
                    <span className="font-mono text-[11px] text-mute">{items.length}</span>
                    {value ? <span className="ml-auto font-mono text-[11px] text-mute">${value}</span> : null}
                  </header>
                  <div className="flex min-h-[120px] flex-col gap-2">
                    {items.map((p) => (
                      <Card key={p.id} p={p} onOpen={setOpenId} onDragStart={onDragStart} dragging={dragId === p.id} />
                    ))}
                    {!items.length ? (
                      <p className="grid flex-1 place-items-center rounded-[7px] border border-dashed border-line px-3 py-6 text-center text-[11px] text-mute/80">
                        {over ? 'Drop here' : stage.hint}
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Surface reveal={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-4 py-2.5 font-semibold">Business</th>
                    <th className="px-4 py-2.5 font-semibold">Stage</th>
                    <th className="px-4 py-2.5 font-semibold">Contact</th>
                    <th className="px-4 py-2.5 font-semibold">Opened</th>
                    <th className="px-4 py-2.5 font-semibold">Follow-up</th>
                    <th className="px-4 py-2.5 font-semibold">Last touch</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((p) => (
                    <tr key={p.id} data-card onClick={() => setOpenId(p.id)} className="cursor-pointer transition hover:bg-canvas/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{p.businessName}</p>
                        <p className="text-[12px] text-mute">
                          {nicheShort[p.nicheId]} · {p.city}
                          {p.country ? `, ${p.country}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.stage === 'won' ? 'pine' : p.stage === 'demo' ? 'ember' : p.stage === 'lost' ? 'neutral' : 'neutral'}>
                          {stageLabel(p.stage)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink/80">
                        {p.ownerName ? <p className="font-medium text-ink">{p.ownerName}</p> : null}
                        <p className="truncate">{p.email || (p.instagram ? `@${p.instagram}` : '—')}</p>
                      </td>
                      <td className="px-4 py-3">{p.lastViewedAt ? <ViewedChip p={p} /> : <span className="text-[12px] text-mute">Not yet</span>}</td>
                      <td className="px-4 py-3">{followUpState(p) ? <FollowChip p={p} /> : <span className="text-mute">—</span>}</td>
                      <td className="px-4 py-3 text-[12px] text-mute">
                        <p className="max-w-[220px] truncate text-ink/80">{p.activity[0]?.text}</p>
                        <p className="font-mono text-[11px]">{timeAgo(p.activity[0]?.at)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12px] text-ink">${p.dealValue ?? 0}/mo</td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-mute">
                        No prospects match these filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Surface>
        )}
      </div>

      <ProspectDetail
        prospect={openProspect}
        onClose={() => setOpenId(null)}
        onEdit={() => {
          setForm({ open: true, prospect: openProspect });
          setOpenId(null);
        }}
      />
      <ProspectForm
        open={form.open}
        prospect={form.prospect}
        onClose={() => setForm({ open: false, prospect: null })}
        onSaved={(p) => setOpenId(p.id)}
      />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </PageShell>
  );
}
