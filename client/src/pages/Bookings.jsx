import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { api, formatMoney, formatWhen } from '../api';
import { useDemo } from '../context/DemoContext';
import * as v from '../lib/validate';
import { gsap } from '../lib/motion';
import { trackAction } from '../lib/track';
import { Badge, Btn, Field, PageShell, Segmented, Select, Surface, inputCls, useShake } from '../components/ui';

const statusTone = {
  confirmed: 'pine',
  'checked-in': 'ink',
  completed: 'pine',
  'no-show-protected': 'ember',
  cancelled: 'neutral'
};

export default function Bookings() {
  const { state, setState, showToast } = useDemo();
  const { business: b, bookings } = state;
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [serviceId, setServiceId] = useState(b.services[0].id);
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState('tomorrow-11');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const drawer = useRef(null);
  const scrim = useRef(null);
  const formShake = useShake();

  useEffect(() => {
    setServiceId(b.services[0].id);
  }, [b.services]);

  const [view, setView] = useState('all');
  const sorted = useMemo(
    () =>
      [...bookings]
        .filter((x) => (view === 'all' ? true : view === 'open' ? x.status !== 'completed' : x.status === 'completed'))
        .sort((a, c) => new Date(a.start) - new Date(c.start)),
    [bookings, view]
  );
  const openCount = bookings.filter((x) => x.status !== 'completed').length;

  const slots = [
    { id: 'tomorrow-11', label: 'Tomorrow 11:00 AM' },
    { id: 'tomorrow-14', label: 'Tomorrow 2:30 PM' },
    { id: 'thu-10', label: 'Thu 10:00 AM' },
    { id: 'sat-9', label: 'Sat 9:00 AM' }
  ];

  function slotIso(id) {
    const d = new Date();
    if (id === 'tomorrow-11') {
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
    } else if (id === 'tomorrow-14') {
      d.setDate(d.getDate() + 1);
      d.setHours(14, 30, 0, 0);
    } else if (id === 'thu-10') {
      const add = (4 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + add);
      d.setHours(10, 0, 0, 0);
    } else {
      const add = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + add);
      d.setHours(9, 0, 0, 0);
    }
    return d.toISOString();
  }

  useGSAP(() => {
    if (!widgetOpen || !drawer.current) return;
    gsap.fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: 0.28 });
    gsap.fromTo(drawer.current, { x: 40, opacity: 0.5 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power4.out' });
  }, { dependencies: [widgetOpen] });

  async function complete(id) {
    setBusy(true);
    try {
      const next = await api.completeAndReview(id);
      setState(next);
      showToast('Visit complete — review SMS queued');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    const next = await api.patchBooking(id, status);
    setState(next);
  }

  async function publicBook(e) {
    e.preventDefault();
    const next = v.collect({
      customer: v.personName(customer),
      phone: v.phone(phone),
      serviceId: serviceId ? '' : 'Select a service',
      slot: slot ? '' : 'Pick a time'
    });
    setErrors(next.errors);
    if (!next.ok) {
      formShake.run();
      showToast('Check the booking form', 'error');
      return;
    }
    setBusy(true);
    try {
      const data = await api.createBooking({
        customer: customer.trim(),
        phone: phone.trim(),
        serviceId,
        start: slotIso(slot),
        source: 'Link-in-bio'
      });
      setState(data);
      trackAction('booking');
      setCustomer('');
      setPhone('');
      setErrors({});
      showToast('Appointment booked from the public page');
    } finally {
      setBusy(false);
    }
  }

  const selected = b.services.find((s) => s.id === serviceId) || b.services[0];

  return (
    <PageShell
      kicker="Calendar"
      title="Bookings"
      subtitle={`Deposits, reminders, and one-click review requests for ${b.name}.`}
      actions={
        <Btn variant="primary" onClick={() => setWidgetOpen(true)}>
          Preview booking page
        </Btn>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <Surface className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <h2 className="text-[14px] font-semibold">Appointments</h2>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'all', label: 'All', count: bookings.length },
                { value: 'open', label: 'Open', count: openCount },
                { value: 'done', label: 'Completed', count: bookings.length - openCount }
              ]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-[11px] uppercase tracking-[0.08em] text-mute">
                  <th className="px-5 py-2.5 font-medium">When</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Service</th>
                  <th className="px-3 py-2.5 text-right font-medium">Value</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-mute">
                      Nothing here yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((job) => (
                    <tr key={job.id} className="border-b border-line transition last:border-0 hover:bg-canvas/50">
                      <td className="px-5 py-3.5 align-top">
                        <p className="font-medium">{formatWhen(job.start)}</p>
                        <p className="text-[12px] text-mute">{job.duration} min</p>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <p className="font-medium">{job.customer}</p>
                        <p className="text-[12px] text-mute">{job.source}</p>
                      </td>
                      <td className="px-3 py-3.5 align-top">{job.service}</td>
                      <td className="px-3 py-3.5 text-right align-top tabular-nums">
                        {job.price ? formatMoney(job.price, b.currency) : '—'}
                        {job.deposit ? <p className="text-[11px] text-mute">{formatMoney(job.deposit, b.currency)} held</p> : null}
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <Badge tone={statusTone[job.status] || 'neutral'}>{job.status.replaceAll('-', ' ')}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right align-top">
                        <div className="flex justify-end gap-1.5">
                          {job.status === 'confirmed' ? (
                            <Btn size="sm" variant="ghost" onClick={() => setStatus(job.id, 'checked-in')}>
                              Check in
                            </Btn>
                          ) : null}
                          {job.status !== 'completed' ? (
                            <Btn size="sm" variant="pine" disabled={busy} onClick={() => complete(job.id)}>
                              Complete
                            </Btn>
                          ) : (
                            <span className="inline-flex h-8 items-center gap-1 text-[12px] text-moss">
                              <CheckCircle2 size={13} /> Review sent
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Surface>

        <div className="space-y-3">
          <Surface className="p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <Clock size={15} className="text-pine" /> Reminders
            </p>
            <ul className="mt-3 space-y-2 text-[13px] text-mute">
              <li>24h before — SMS + email with a reschedule link</li>
              <li>2h before — “Reply YES” (no-show protection)</li>
              <li>After complete — review funnel with the shield</li>
            </ul>
          </Surface>
          <Surface className="bg-ink p-5 text-paper">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8c8]">On the call</p>
            <p className="mt-2 font-display text-[1.55rem] leading-snug">One recovered no-show pays for the month.</p>
            <p className="mt-2 text-[13px] text-white/55">
              Average ticket at {b.name} is {formatMoney(state.metrics.avgTicket, b.currency)}. PulseLocal is $79/mo.
            </p>
          </Surface>
        </div>
      </div>

      {widgetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <button ref={scrim} className="absolute inset-0 bg-[#17150F]/45" onClick={() => setWidgetOpen(false)} aria-label="Close booking page" />
          <div ref={drawer} className="relative flex h-full w-full max-w-md flex-col bg-canvas">
            <div className="flex items-center justify-between bg-pine px-5 py-4 text-[#f4efe4]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e8c8]">Book · {b.city}</p>
                <p className="font-display text-[1.35rem]">{b.name}</p>
              </div>
              <button onClick={() => setWidgetOpen(false)} className="p-1 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <form ref={formShake.ref} onSubmit={publicBook} className="flex-1 space-y-4 overflow-y-auto p-5">
              <p className="text-[13px] text-mute">Thirty seconds. No account required.</p>
              <div className="grid gap-2">
                {b.services.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`flex items-center justify-between border px-3 py-3 text-left ${
                      serviceId === s.id ? 'border-pine bg-paper' : 'border-transparent bg-paper'
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-semibold">{s.name}</p>
                      <p className="text-[12px] text-mute">{s.duration} min · {s.category}</p>
                    </div>
                    <p className="text-[13px]">{s.price ? formatMoney(s.price, b.currency) : 'Free'}</p>
                  </button>
                ))}
              </div>
              <Field label="Your name" error={errors.customer}>
                <input
                  className={inputCls(errors.customer)}
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Alex Rivera"
                  maxLength={50}
                />
              </Field>
              <Field label="Mobile" error={errors.phone} hint="We’ll text the confirmation here">
                <input
                  className={inputCls(errors.phone)}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 214 555 0199"
                />
              </Field>
              <Field label="Time" error={errors.slot}>
                <Select
                  ariaLabel="Appointment time"
                  value={slot}
                  error={errors.slot}
                  onChange={setSlot}
                  options={slots.map((s) => ({ value: s.id, label: s.label }))}
                />
              </Field>
              {selected.price >= 400 ? (
                <p className="border border-line bg-paper px-3 py-2 text-[12px] text-mute">
                  A {formatMoney(Math.round(selected.price * 0.2), b.currency)} deposit holds this service.
                </p>
              ) : null}
              <Btn type="submit" disabled={busy} variant="primary" className="h-12 w-full">
                <CalendarCheck size={16} /> Confirm {selected.name}
              </Btn>
            </form>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
