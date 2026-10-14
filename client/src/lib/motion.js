import gsap from 'gsap';

gsap.defaults({ ease: 'power3.out' });

export function reveal(root) {
  if (!root) return;
  const items = root.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  gsap.fromTo(
    items,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.72, stagger: 0.07, overwrite: 'auto' }
  );
}

export function shake(el) {
  if (!el) return;
  gsap.fromTo(el, { x: 0 }, { x: 8, duration: 0.08, yoyo: true, repeat: 5, ease: 'power1.inOut' });
}

export function popIn(el) {
  if (!el) return;
  gsap.fromTo(
    el,
    { y: 16, opacity: 0, scale: 0.98 },
    { y: 0, opacity: 1, scale: 1, duration: 0.38, ease: 'power2.out' }
  );
}

export { gsap };
