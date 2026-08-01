import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tire: {
          black: '#070707',
          charcoal: '#141414',
          steel: '#242424',
          cream: '#f6f3ec',
          muted: '#b5b0a7',
          red: '#b91c1c',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        tread:
          'linear-gradient(135deg, transparent 46%, rgba(255,255,255,.35) 48%, transparent 50%), linear-gradient(45deg, transparent 46%, rgba(255,255,255,.25) 48%, transparent 50%)',
      },
    },
  },
  plugins: [],
};

export default config;
