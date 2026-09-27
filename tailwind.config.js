const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Warm near-black neutrals instead of Tailwind's blue-grey slate. Every page uses slate-*,
      // so this one palette sets the look of the whole site.
      colors: {
        slate: {
          50: '#fafaf9',
          100: '#f3f2f0',
          200: '#e4e2df',
          300: '#cdcac6',
          400: '#a09c97',
          500: '#78736e',
          600: '#57534f',
          700: '#393633',
          800: '#252321',
          900: '#141312',
          950: '#0c0b0a',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        // One "lub-dub" per second for the voting countdown.
        heartbeat: {
          '0%, 40%, 100%': { transform: 'scale(1)' },
          '10%': { transform: 'scale(1.25)' },
          '20%': { transform: 'scale(1.05)' },
          '30%': { transform: 'scale(1.2)' },
        },
        heartbeatRing: {
          '0%': { boxShadow: '0 0 0 0 var(--beat-color)' },
          '70%, 100%': { boxShadow: '0 0 0 10px transparent' },
        },
        // An upvote floating up from the vote button and fading out.
        floatUp: {
          '0%': { opacity: 0, transform: 'translate(-50%, 0) scale(0.5)' },
          '12%': { opacity: 1, transform: 'translate(-50%, -14px) scale(1.15)' },
          '70%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'translate(calc(-50% + var(--drift, 0px)), -76px) scale(1)' },
        },
        ringPop: {
          '0%': { opacity: 0.9, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(1.35)' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
          '30%': { opacity: 1, transform: 'translateY(-3px)' },
        },
        tick: {
          from: { opacity: 0, transform: 'translateY(-40%)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        overlayShow: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        contentShow: {
          from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
          to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        heartbeat: 'heartbeat 1s ease-in-out infinite',
        'heartbeat-fast': 'heartbeat 0.7s ease-in-out infinite',
        'heartbeat-ring': 'heartbeatRing 1s ease-out infinite',
        'heartbeat-ring-fast': 'heartbeatRing 0.7s ease-out infinite',
        tick: 'tick 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'float-up': 'floatUp 1400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        typing: 'typing 1s ease-in-out infinite',
        'ring-pop': 'ringPop 600ms ease-out both',
        overlayShow: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        contentShow: 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')({
      strategy: 'class', // only generate classes
    }),
  ],
};
