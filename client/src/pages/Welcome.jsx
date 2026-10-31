import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { CheckCircle2 } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import { currentRef } from '../lib/track';
import OnboardingForm from '../components/OnboardingForm';
import { LogoMark } from '../components/Brand';

export default function Welcome() {
  const { offer, state } = useDemo();
  const [params] = useSearchParams();
  const card = useRef(null);
  const brand = offer?.brandName || 'PulseLocal AI';
  const plan = params.get('plan') || '';

  useGSAP(() => {
    gsap.fromTo(card.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  });

  useEffect(() => {
    document.title = `Welcome · ${brand}`;
    return () => {
      document.title = 'PulseLocal AI';
    };
  }, [brand]);

  return (
    <div className="relative min-h-[100dvh] bg-canvas px-4 py-10 md:py-16">
      <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div ref={card} className="relative mx-auto w-full max-w-[560px]">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark />
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{brand}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-paper p-6 shadow-lift md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pineSoft text-pine">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h1 className="font-display text-[1.6rem] leading-tight text-ink">You're in. Let's set it up.</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
                Thanks for your payment. Two minutes here and we can have your desk live in about {offer?.setupDays || 2} days.
              </p>
            </div>
          </div>
          <OnboardingForm
            offer={offer}
            initialPlan={plan}
            business={currentRef() ? state?.business : null}
            submitLabel="Start my setup"
          />
        </div>
        <p className="mt-5 text-center text-[12px] text-mute">
          Questions? {offer?.contactEmail ? <a href={`mailto:${offer.contactEmail}`} className="underline">{offer.contactEmail}</a> : 'Reply to your payment receipt.'}
        </p>
      </div>
    </div>
  );
}
