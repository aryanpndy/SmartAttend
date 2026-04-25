import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8f1ff',
          200: '#b9e7ff',
          300: '#89daff',
          400: '#52c4ff',
          500: '#2aa5f5',
          600: '#1486e8',
          700: '#0d6dd4',
          800: '#1158ab',
          900: '#144c87',
          950: '#112f52',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffeed4',
          200: '#fed9a8',
          300: '#fdbd71',
          400: '#fb9838',
          500: '#f97a11',
          600: '#ea5d07',
          700: '#c24308',
          800: '#9a360f',
          900: '#7c2e10',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}
export default config
