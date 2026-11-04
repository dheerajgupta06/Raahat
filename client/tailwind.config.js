/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        body: 'rgb(var(--c-body) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--c-accent-soft) / <alpha-value>)',
        ok: 'rgb(var(--c-ok) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        brand: {
          DEFAULT: '#DC2626',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          900: '#450a0a',
        },
        pulse: '#2DE2E6',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans Devanagari"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 32px rgba(45, 226, 230, 0.16)',
        'glow-strong': '0 0 46px rgba(45, 226, 230, 0.32)',
        sos: '0 0 34px rgba(220, 38, 38, 0.32)',
        'sos-strong': '0 0 48px rgba(244, 63, 94, 0.45)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.45)' },
          '50%': { opacity: 0.75, boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pingSlow: {
          '0%': { transform: 'scale(0.9)', opacity: 0.7 },
          '70%, 100%': { transform: 'scale(2.2)', opacity: 0 },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease-out both',
        'pulse-dot': 'pulseDot 2.2s ease-in-out infinite',
        radar: 'radar 8s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
        'ping-slow': 'pingSlow 2.4s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
