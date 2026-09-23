/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /**
       * ---------------------------------------------------------------------
       *  COLOUR PALETTE  "Nocturne"  (single source of truth)
       * ---------------------------------------------------------------------
       *  ink    - midnight surfaces / app background
       *  brand  - violet primary actions, active nav, focus rings
       *  accent - amber high-emphasis CTA + ratings
       *  coral  - trending / hot badges
       *  mint   - likes, success states
       *  sky    - info, links, "new" badges
       *  fog    - text on dark surfaces
       * Mirrored as CSS variables in src/index.css (:root).
       */
      colors: {
        /**
         * ink & fog resolve through CSS variables (RGB triplets declared in
         * src/index.css) so the dark/light theme toggle can re-skin every
         * existing class without touching component markup. <alpha-value>
         * keeps opacity modifiers such as bg-ink-900/80 working.
         */
        ink: {
          950: 'rgb(var(--rgb-ink-950) / <alpha-value>)',
          900: 'rgb(var(--rgb-ink-900) / <alpha-value>)',
          800: 'rgb(var(--rgb-ink-800) / <alpha-value>)',
          700: 'rgb(var(--rgb-ink-700) / <alpha-value>)',
          600: 'rgb(var(--rgb-ink-600) / <alpha-value>)',
          500: 'rgb(var(--rgb-ink-500) / <alpha-value>)',
        },
        brand: {
          300: '#B9AEFF',
          400: '#9B87FF',
          500: '#7C5CFF',
          600: '#6540E8',
          700: '#4E2EBC',
        },
        accent: {
          300: '#FFE0A3',
          400: '#FFC65C',
          500: '#FFA91D',
          600: '#E08C00',
        },
        coral: {
          400: '#FF7A9C',
          500: '#FF4D7D',
          600: '#E32B62',
        },
        mint: {
          400: '#4FE3B8',
          500: '#16C79A',
          600: '#0E9C79',
        },
        sky: {
          400: '#63CCFF',
          500: '#22A9F0',
          600: '#0F82C4',
        },
        fog: {
          50: 'rgb(var(--rgb-fog-50) / <alpha-value>)',
          100: 'rgb(var(--rgb-fog-100) / <alpha-value>)',
          300: 'rgb(var(--rgb-fog-300) / <alpha-value>)',
          400: 'rgb(var(--rgb-fog-400) / <alpha-value>)',
          500: 'rgb(var(--rgb-fog-500) / <alpha-value>)',
          600: 'rgb(var(--rgb-fog-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(3, 6, 20, 0.9)',
        nav: '0 12px 30px -22px rgba(3, 6, 20, 0.95)',
        glow: '0 0 0 1px rgba(124, 92, 255, 0.35), 0 18px 45px -20px rgba(124, 92, 255, 0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C5CFF 0%, #6540E8 45%, #4E2EBC 100%)',
        'accent-gradient': 'linear-gradient(135deg, #FFC65C 0%, #FFA91D 100%)',
        'coral-gradient': 'linear-gradient(135deg, #FF7A9C 0%, #E32B62 100%)',
        'surface-fade': 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(5,5,5,0.92) 72%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
};
