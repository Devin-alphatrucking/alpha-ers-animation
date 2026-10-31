const AVATAR_TONES = [
  ['#FDEEE6', '#C2410C'],
  ['#E6F4EE', '#0A6B4E'],
  ['#EAF1FE', '#1D4ED8'],
  ['#F3EEFD', '#6D28D9'],
  ['#FEF6E4', '#A16207'],
  ['#FDECF2', '#BE185D']
];

export function initialsOf(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function toneFor(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export function Avatar({ name, size = 28, className = '' }) {
  const [bg, fg] = toneFor(name);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[8px] font-semibold ${className}`}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

export function LogoMark({ size = 28, dark = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill={dark ? '#FFFFFF' : '#0D0E10'} />
      <path
        d="M6 17h5l2.2-6 4.3 12 2.6-8.5L21.6 17H26"
        fill="none"
        stroke="#F0561D"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ dark = false, sub }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark dark={dark} />
      <span className="leading-none">
        <span className={`block text-[15px] font-semibold tracking-[-0.02em] ${dark ? 'text-white' : 'text-ink'}`}>PulseLocal</span>
        {sub ? <span className={`mt-1 block font-mono text-[10px] ${dark ? 'text-white/45' : 'text-mute'}`}>{sub}</span> : null}
      </span>
    </span>
  );
}
