/** @type {import('tailwindcss').Config} */

// Electric emerald accent ramp. `primary` is aliased to the same values so the
// existing `primary-*` classes across the app pick up the new brand color
// without markup changes. White text is only readable on 700+; dark gray-950
// text on 400/500 fills is the high-contrast CTA treatment.
const accent = {
  50: '#effef6',
  100: '#d8fdec',
  200: '#b4f8da',
  300: '#7bf0c0',
  400: '#3ce09e',
  500: '#14cd82',
  600: '#09a869',
  700: '#088456',
  800: '#0a6847',
  900: '#0a553c',
  950: '#02301f',
};

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent,
        primary: accent,
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.10)',
        'card-hover': '0 2px 4px 0 rgb(15 23 42 / 0.06), 0 16px 32px -12px rgb(15 23 42 / 0.16)',
        premium: '0 20px 40px -12px rgb(20 205 130 / 0.25)',
        glow: '0 0 0 1px rgb(20 205 130 / 0.18), 0 8px 24px -8px rgb(20 205 130 / 0.35)',
        modal: '0 8px 10px -6px rgb(15 23 42 / 0.10), 0 24px 48px -12px rgb(15 23 42 / 0.22)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at top, var(--tw-gradient-stops))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
