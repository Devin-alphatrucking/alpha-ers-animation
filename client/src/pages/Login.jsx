import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import { Btn, Field, inputCls, useShake } from '../components/ui';
import { Logo } from '../components/Brand';

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
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-canvas px-4">
      <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      <div ref={card} className="relative w-full max-w-[380px]">
        <div className="mb-6">
          <Logo sub="Owner area" />
        </div>
        <form ref={shaker.ref} onSubmit={submit} noValidate className="rounded-[14px] border border-line bg-paper p-6 shadow-lift">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-ink/[0.05] text-ink">
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
