import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Globe, MapPin, Phone, Search, Star } from 'lucide-react';
import { api } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { Badge, Btn, Field, PageShell, Select, Surface, inputCls, useShake } from '../components/ui';

const STORE_KEY = 'pl_lead_search';

const FILTERS = [
  { id: 'noSite', label: 'No website', test: (l) => !l.website },
  { id: 'lowRating', label: 'Rating under 4.5', test: (l) => l.rating === null || l.rating < 4.5 },
  { id: 'fewReviews', label: 'Under 50 reviews', test: (l) => l.reviewCount < 50 },
  { id: 'hideAdded', label: 'Hide ones in Pipeline', test: (l) => !l.inPipeline }
];

const SORTS = [
  { value: 'score', label: 'Best opportunity' },
  { value: 'rating', label: 'Lowest rating' },
  { value: 'reviews', label: 'Fewest reviews' }
];

const TIER_TONE = { hot: 'ember', good: 'pine', low: 'neutral' };
const TIER_LABEL = { hot: 'Hot', good: 'Good', low: 'Low' };

function loadSaved() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORE_KEY)) || null;
  } catch {
    return null;
  }
}

export default function Leads() {
  const { niches, state, setProspects, showToast } = useDemo();
  const saved = loadSaved();
  const [form, setForm] = useState(
    saved?.form || { nicheId: state.business.nicheId, city: '', country: 'United States', keyword: '' }
  );
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(saved?.results || null);
  const [busy, setBusy] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [live, setLive] = useState(saved?.results?.live ?? null);
  const [filters, setFilters] = useState({ hideAdded: true });
  const [sort, setSort] = useState('score');
  const [selected, setSelected] = useState(() => new Set());
  const [enrich, setEnrich] = useState(true);
  const [lastImport, setLastImport] = useState(null);
  const shaker = useShake();

  useEffect(() => {
    api.leadsStatus().then((s) => setLive(s.live)).catch(() => {});
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify({ form, results }));
  }, [form, results]);

  const set = (key) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((x) => ({ ...x, [key]: '' }));
  };

  function validateForm() {
    return v.collect({
      nicheId: form.nicheId ? '' : 'Pick an industry',
      city: v.city(form.city),
      country: v.country(form.country),
      keyword: form.keyword.trim().length > 40 ? 'Keep it under 40 characters' : ''
    });
  }

  async function runSearch(e) {
    e?.preventDefault();
    const check = validateForm();
    setErrors(check.errors);
    if (!check.ok) {
      shaker.run();
      return;
    }
    setBusy(true);
    setLastImport(null);
    try {
      const data = await api.searchLeads(form);
      setResults({ ...data, nicheId: form.nicheId });
      setLive(data.live);
      setSelected(new Set());
      if (!data.leads.length) showToast('No businesses found. Try a nearby city or a different keyword.', 'error');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (!results?.nextPageToken) return;
    setMoreBusy(true);
    try {
      const data = await api.searchLeads({ ...form, nicheId: results.nicheId, pageToken: results.nextPageToken });
      const seen = new Set(results.leads.map((l) => l.placeId));
      setResults((r) => ({ ...r, nextPageToken: data.nextPageToken, leads: [...r.leads, ...data.leads.filter((l) => !seen.has(l.placeId))] }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMoreBusy(false);
    }
  }

  const visible = useMemo(() => {
    if (!results) return [];
    const active = FILTERS.filter((f) => filters[f.id]);
    const list = results.leads.filter((l) => active.every((f) => f.test(l)));
    const sorters = {
      score: (a, b) => b.score - a.score,
      rating: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
      reviews: (a, b) => a.reviewCount - b.reviewCount
    };
    return [...list].sort(sorters[sort]);
  }, [results, filters, sort]);

  const selectable = visible.filter((l) => !l.inPipeline);
  const allSelected = selectable.length > 0 && selectable.every((l) => selected.has(l.placeId));

  function toggle(id) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected((s) => {
      const n = new Set(s);
      if (allSelected) selectable.forEach((l) => n.delete(l.placeId));
      else selectable.forEach((l) => n.add(l.placeId));
      return n;
    });
  }

  async function addSelected() {
    const leads = results.leads.filter((l) => selected.has(l.placeId) && !l.inPipeline);
    if (!leads.length) return;
    setImporting(true);
    try {
      const res = await api.importLeads({ leads, nicheId: results.nicheId, enrich });
      setProspects(res.prospects);
      const byPlace = new Map(res.prospects.filter((p) => p.placeId).map((p) => [p.placeId, p]));
      setResults((r) => ({
        ...r,
        leads: r.leads.map((l) => {
          const p = byPlace.get(l.placeId);
          return p ? { ...l, inPipeline: { id: p.id, stage: p.stage } } : l;
        })
      }));
      setSelected(new Set());
      setLastImport(res);
      showToast(
        res.imported
          ? `Added ${res.imported} to Pipeline${enrich ? ` · ${res.withEmail} with email · ${res.withInstagram} with Instagram` : ''}`
          : 'Nothing new was added',
        res.imported ? 'ok' : 'error'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  }

  const nicheOptions = niches.map((n) => ({ value: n.id, label: n.label }));
  const counts = results
    ? {
        total: results.leads.length,
        hot: results.leads.filter((l) => l.tier === 'hot').length,
        noSite: results.leads.filter((l) => !l.website).length
      }
    : null;

  return (
    <PageShell
      kicker="Your sales"
      title="Lead finder"
      subtitle="Search Google Maps for local businesses that need this most (weak ratings, few reviews, no website) and add them to your Pipeline in one click."
    >
      {live === false ? (
        <div data-reveal className="mb-4 rounded-[8px] border border-ember/25 bg-emberSoft px-4 py-3 text-[13px]">
          <span className="font-semibold text-ink">Showing sample businesses.</span>{' '}
          <span className="text-mute">
            Add <code className="rounded bg-paper px-1 font-mono text-[12px]">GOOGLE_PLACES_API_KEY</code> to your server
            settings to search real Google Maps listings. Setup steps are in the README.
          </span>
        </div>
      ) : null}

      <Surface className="mb-4 p-5">
        <form ref={shaker.ref} onSubmit={runSearch} noValidate className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-[200px_1fr_1fr_1fr_auto]">
          <Field label="Industry" error={errors.nicheId}>
            <Select value={form.nicheId} onChange={set('nicheId')} options={nicheOptions} ariaLabel="Industry" />
          </Field>
          <Field label="City" error={errors.city}>
            <input value={form.city} onChange={set('city')} maxLength={40} placeholder="Austin" className={inputCls(errors.city)} />
          </Field>
          <Field label="Country" error={errors.country}>
            <input value={form.country} onChange={set('country')} maxLength={40} placeholder="United States" className={inputCls(errors.country)} />
          </Field>
          <Field label="Keyword (optional)" error={errors.keyword}>
            <input value={form.keyword} onChange={set('keyword')} maxLength={40} placeholder="e.g. roofing contractor" className={inputCls(errors.keyword)} />
          </Field>
          <div className="md:col-span-2 xl:col-span-1 xl:pt-[22px]">
            <Btn type="submit" size="lg" className="h-10 w-full xl:w-auto" disabled={busy}>
              <Search size={15} /> {busy ? 'Searching…' : 'Find businesses'}
            </Btn>
          </div>
        </form>
      </Surface>

      {lastImport?.skipped?.length ? (
        <div className="mb-4 rounded-[8px] border border-line bg-paper px-4 py-3 text-[12px] text-mute">
          <span className="font-semibold text-ink">Skipped {lastImport.skipped.length}:</span>{' '}
          {lastImport.skipped.slice(0, 6).map((s) => `${s.businessName} (${s.reason})`).join(' · ')}
          {lastImport.skipped.length > 6 ? ' …' : ''}
        </div>
      ) : null}

      {results ? (
        <Surface className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <p className="mr-2 text-[13px] text-mute">
              <span className="font-semibold text-ink">{counts.total}</span> found · {counts.hot} hot · {counts.noSite} without a website
            </p>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilters((x) => ({ ...x, [f.id]: !x[f.id] }))}
                aria-pressed={Boolean(filters[f.id])}
                className={`h-7 rounded-full border px-3 text-[12px] font-medium transition ${
                  filters[f.id] ? 'border-pine bg-pineSoft text-pine' : 'border-line bg-paper text-mute hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto w-44">
              <Select value={sort} onChange={setSort} options={SORTS} ariaLabel="Sort" align="right" />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[960px] text-left text-[13px]">
              <thead className="bg-canvas/60 text-[11px] uppercase tracking-[0.1em] text-mute">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="accent-ink" />
                  </th>
                  <th className="px-2 py-2.5 font-semibold">Business</th>
                  <th className="px-2 py-2.5 font-semibold">Google</th>
                  <th className="px-2 py-2.5 font-semibold">Website</th>
                  <th className="px-2 py-2.5 font-semibold">Phone</th>
                  <th className="px-2 py-2.5 font-semibold">Opportunity</th>
                  <th className="px-4 py-2.5 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((l) => {
                  const on = selected.has(l.placeId);
                  return (
                    <tr
                      key={l.placeId}
                      onClick={() => !l.inPipeline && toggle(l.placeId)}
                      className={`transition ${l.inPipeline ? 'opacity-60' : 'cursor-pointer hover:bg-canvas/50'} ${on ? 'bg-pineSoft' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={Boolean(l.inPipeline)}
                          onChange={() => toggle(l.placeId)}
                          aria-label={`Select ${l.businessName}`}
                          className="accent-ink"
                        />
                      </td>
                      <td className="max-w-[280px] px-2 py-3">
                        <p className="truncate font-semibold text-ink">{l.businessName}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-mute">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{l.address}</span>
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3">
                        {l.rating !== null ? (
                          <span className="inline-flex items-center gap-1">
                            <Star size={12} className="fill-gold text-gold" />
                            <span className="font-semibold tabular-nums">{l.rating.toFixed(1)}</span>
                            <span className="text-[12px] text-mute">({l.reviewCount})</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-mute">No rating</span>
                        )}
                      </td>
                      <td className="max-w-[180px] px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        {l.website ? (
                          <a
                            href={l.sample ? undefined : l.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-1 truncate text-[12px] text-pine hover:underline"
                          >
                            <Globe size={12} className="shrink-0" />
                            <span className="truncate">{l.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                          </a>
                        ) : (
                          <span className="text-[12px] font-medium text-ember">None</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-[12px] text-mute">
                        {l.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} /> {l.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={TIER_TONE[l.tier]}>{TIER_LABEL[l.tier]}</Badge>
                          <div className="h-1 w-14 bg-canvas">
                            <div className={`h-full ${l.tier === 'hot' ? 'bg-ember' : 'bg-pine'}`} style={{ width: `${Math.max(6, l.score)}%` }} />
                          </div>
                        </div>
                        {l.reasons.length ? <p className="mt-1 max-w-[240px] truncate text-[11px] text-mute">{l.reasons.join(' · ')}</p> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {l.inPipeline ? (
                          <Link to="/prospects" className="text-[12px] font-medium text-pine hover:underline">
                            In Pipeline
                          </Link>
                        ) : l.mapsUrl ? (
                          <a href={l.mapsUrl} target="_blank" rel="noreferrer" aria-label="Open in Google Maps" className="inline-grid h-7 w-7 place-items-center rounded text-mute hover:bg-canvas hover:text-ink">
                            <ExternalLink size={13} />
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {!visible.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-mute">
                      No businesses match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {results.nextPageToken ? (
            <div className="border-t border-line px-4 py-3 text-center">
              <Btn variant="ghost" onClick={loadMore} disabled={moreBusy}>
                {moreBusy ? 'Loading…' : 'Load 20 more'}
              </Btn>
            </div>
          ) : null}
        </Surface>
      ) : (
        <Surface className="p-8 text-center">
          <p className="font-display text-[1.35rem]">Start with one city</p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-mute">
            Pick an industry and a city you want to sell in. Businesses with no website, a rating under 4.5 or only a
            handful of reviews are marked Hot. Those are the easiest yeses.
          </p>
        </Surface>
      )}

      {selected.size ? (
        <div className="sticky bottom-3 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-ink px-4 py-3 text-paper shadow-[0_18px_44px_rgba(23,21,15,0.25)]">
          <p className="text-[13px] font-semibold">{selected.size} selected</p>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-white/70">
            <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} className="accent-ember" />
            Find emails & Instagram from their websites
          </label>
          <div className="ml-auto flex gap-2">
            <Btn variant="quiet" className="text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setSelected(new Set())}>
              Clear
            </Btn>
            <Btn onClick={addSelected} disabled={importing}>
              {importing ? (enrich ? 'Checking websites…' : 'Adding…') : `Add ${selected.size} to Pipeline`}
            </Btn>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
