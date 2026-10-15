import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import { Btn, Field, inputCls, useShake } from '../components/ui';

export default function Login() {
  const { owner, login } = useDemo();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const card = useRef(null);
  const shaker = useShake();
  const next = params.get('next');
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/prospects';

  useGSAP(() => {
    gsap.fromTo(card.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  });

  useEffect(() => {
    document.title = 'Owner login · PulseLocal';
    return () => {
      document.title = 'PulseLocal AI';
    };
  }, []);

  if (owner) return <Navigate to={target} replace />;

  async function submit(e) {
    e.preventDefault();
    if (!password) {
      setError('Enter your password');
      shaker.run();
      return;
    }
    setBusy(true);
    try {
      await login(password);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.errors?.password || err.message);
      setPassword('');
      shaker.run();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#132822] px-4">
      <div ref={card} className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center gap-2.5 text-[#f4efe4]">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-ember font-display text-[16px] text-white">P</span>
          <div className="leading-none">
            <p className="font-display text-[1.15rem]">PulseLocal</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">Owner area</p>
          </div>
        </div>
        <form ref={shaker.ref} onSubmit={submit} noValidate className="rounded-[10px] border border-line bg-paper p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-canvas text-pine">
              <Lock size={16} />
            </span>
            <div>
              <h1 className="font-display text-[1.35rem] leading-tight text-ink">Welcome back</h1>
              <p className="text-[12px] text-mute">Your pipeline and pitch scripts are private.</p>
            </div>
          </div>
          <Field label="Password" error={error}>
            <div className="relative">
              <input
                autoFocus
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                maxLength={200}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className={`${inputCls(error)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-mute hover:text-ink"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Btn type="submit" variant="pine" size="lg" className="mt-5 w-full" disabled={busy}>
            {busy ? 'Checking…' : 'Open my pipeline'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
