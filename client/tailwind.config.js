/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        display: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        canvas: '#F5F5F3',
        paper: '#FFFFFF',
        ink: '#0D0E10',
        inkSoft: '#26282D',
        mute: '#6A6F78',
        line: '#E8E8E5',
        lineStrong: '#D4D4CF',
        pine: '#0A6B4E',
        pineBright: '#0C8A63',
        pineSoft: '#E6F4EE',
        moss: '#15803D',
        ember: '#F0561D',
        emberDeep: '#D4440F',
        emberSoft: '#FDEEE6',
        emberTint: '#FFB596',
        gold: '#E9A23B',
        night: '#0D0E10',
        imessage: '#0A84FF'
      },
      boxShadow: {
        card: '0 1px 0 rgba(13,14,16,0.03), 0 1px 2px rgba(13,14,16,0.04)',
        lift: '0 1px 0 rgba(13,14,16,0.04), 0 8px 24px -6px rgba(13,14,16,0.10)',
        pop: '0 0 0 1px rgba(13,14,16,0.06), 0 24px 60px -12px rgba(13,14,16,0.25)',
        btn: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(13,14,16,0.18)'
      },
      letterSpacing: {
        tightest: '-0.04em'
      }
    }
  },
  plugins: []
};
