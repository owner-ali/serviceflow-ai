import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#04140f',
          900: '#071f17',
          800: '#0b2d20',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        mint: '#6ee7b7',
        lime: '#bef264',
        graphite: '#1c1f1e',
        offwhite: '#f7f8f4',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
