/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        canvas: '#EDE8DC',
        paper: '#FBF8F1',
        ink: '#17150F',
        mute: '#6F685C',
        line: '#DDD4C4',
        pine: '#1C4A3E',
        pineBright: '#2A6B58',
        ember: '#D04A17',
        moss: '#1F6B4A'
      }
    }
  },
  plugins: []
};
