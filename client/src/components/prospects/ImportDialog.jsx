import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileUp, XCircle } from 'lucide-react';
import { api } from '../../api';
import { useDemo } from '../../context/DemoContext';
import { SAMPLE_CSV, nicheShort } from '../../lib/prospects';
import { Btn, Drawer, Field, inputCls, useShake } from '../ui';

const MAX_BYTES = 900 * 1024;

export default function ImportDialog({ open, onClose }) {
  const { setProspects, showToast } = useDemo();
  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);
  const shaker = useShake();

  useEffect(() => {
    if (open) {
      setCsv('');
      setError('');
      setPreview(null);
    }
  }, [open]);

  function fail(msg) {
    setError(msg);
    shaker.run();
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) return fail('Choose a .csv file');
    if (file.size > MAX_BYTES) return fail('File is too large — keep it under 900 KB');
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result || ''));
      setPreview(null);
      setError('');
    };
    reader.onerror = () => fail('Could not read that file');
    reader.readAsText(file);
  }

  async function check() {
    if (!csv.trim()) return fail('Paste CSV rows or choose a file');
    if (csv.length > MAX_BYTES) return fail('Too much data — import in smaller batches');
    setBusy('check');
    try {
      const res = await api.importProspects(csv, true);
      setPreview(res);
      setError('');
    } catch (err) {
      fail(err.message);
    } finally {
      setBusy('');
    }
  }

  async function commit() {
    setBusy('import');
    try {
      const res = await api.importProspects(csv, false);
      setProspects(res.prospects);
      showToast(`Imported ${res.imported} prospect${res.imported === 1 ? '' : 's'}${res.skipped.length ? ` · ${res.skipped.length} skipped` : ''}`);
      onClose();
    } catch (err) {
      fail(err.message);
    } finally {
      setBusy('');
    }
  }

  const ready = preview?.ready?.length || 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      kicker="Bulk import"
      title="Import prospects from CSV"
      width={560}
      footer={
        <>
          <Btn variant="quiet" onClick={onClose}>
            Cancel
          </Btn>
          {preview ? (
            <Btn variant="pine" onClick={commit} disabled={!ready || busy === 'import'}>
              {busy === 'import' ? 'Importing…' : `Import ${ready} prospect${ready === 1 ? '' : 's'}`}
            </Btn>
          ) : (
            <Btn variant="ink" onClick={check} disabled={busy === 'check'}>
              {busy === 'check' ? 'Checking…' : 'Check rows'}
            </Btn>
          )}
        </>
      }
    >
      <div ref={shaker.ref} className="space-y-5">
        <div data-stagger className="rounded-[8px] border border-line bg-canvas/60 p-4 text-[12px] leading-relaxed text-mute">
          <p className="font-semibold text-ink">Columns we understand</p>
          <p className="mt-1">
            <span className="font-mono text-ink/80">business, owner, niche, city, country, email, instagram, phone, website, rating, notes</span>
          </p>
          <p className="mt-1.5">
            Niche accepts words like <em>dentist</em>, <em>hvac</em>, <em>roofing</em>, <em>auto detailing</em>. Each row needs an email or an
            Instagram handle. Up to 500 rows per import; duplicates are skipped.
          </p>
        </div>

        <div data-stagger className="flex flex-wrap gap-2">
          <Btn variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp size={14} />
            Choose CSV file
          </Btn>
          <Btn
            variant="quiet"
            size="sm"
            onClick={() => {
              setCsv(SAMPLE_CSV);
              setPreview(null);
              setError('');
            }}
          >
            Paste sample rows
          </Btn>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" className="hidden" onChange={onFile} />
        </div>

        <Field label="CSV text" error={error} hint={csv ? `${csv.split(/\r?\n/).filter((l) => l.trim()).length} lines` : 'First row must be the header'}>
          <textarea
            rows={8}
            spellCheck={false}
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              setPreview(null);
              if (error) setError('');
            }}
            placeholder={'business,niche,city,email,instagram\nGlow Theory,medspa,Scottsdale,hello@glow.com,'}
            className={`${inputCls(error)} h-auto resize-y py-2.5 font-mono text-[12px] leading-relaxed`}
          />
        </Field>

        {preview ? (
          <div data-stagger className="space-y-3">
            <p className="text-[13px] text-ink">
              <span className="font-semibold">{ready}</span> ready ·{' '}
              <span className={preview.skipped.length ? 'font-semibold text-ember' : ''}>{preview.skipped.length} skipped</span> of {preview.total} rows
            </p>
            <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-[8px] border border-line scrollbar-thin">
              {preview.ready.map((r) => (
                <li key={`r${r.line}`} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                  <CheckCircle2 size={14} className="shrink-0 text-moss" />
                  <span className="truncate font-medium text-ink">{r.businessName}</span>
                  <span className="ml-auto shrink-0 text-[12px] text-mute">
                    {nicheShort[r.nicheId]} · {r.city}
                  </span>
                </li>
              ))}
              {preview.skipped.map((s) => (
                <li key={`s${s.line}`} className="flex items-start gap-3 bg-[#fbf1ea] px-3 py-2 text-[13px]">
                  <XCircle size={14} className="mt-0.5 shrink-0 text-ember" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      Line {s.line}
                      {s.businessName ? ` · ${s.businessName}` : ''}
                    </p>
                    <p className="text-[12px] text-ember">{s.errors.join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}
