import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { CheckCircle2 } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { gsap } from '../lib/motion';
import { currentRef } from '../lib/track';
import OnboardingForm from '../components/OnboardingForm';

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
    <div className="min-h-[100dvh] bg-[#132822] px-4 py-10 md:py-16">
      <div ref={card} className="mx-auto w-full max-w-[560px]">
        <div className="mb-6 flex items-center gap-2.5 text-[#f4efe4]">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-ember font-display text-[16px] text-white">
            {brand.charAt(0)}
          </span>
          <p className="font-display text-[1.15rem]">{brand}</p>
        </div>
        <div className="rounded-[10px] border border-line bg-paper p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:p-8">
          <div className="mb-6 flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-1 shrink-0 text-moss" />
            <div>
              <h1 className="font-display text-[1.7rem] leading-tight text-ink">You're in. Let's set it up.</h1>
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
        <p className="mt-5 text-center text-[12px] text-white/45">
          Questions? {offer?.contactEmail ? <a href={`mailto:${offer.contactEmail}`} className="underline">{offer.contactEmail}</a> : 'Reply to your payment receipt.'}
        </p>
      </div>
    </div>
  );
}
