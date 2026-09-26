/** @type {import('tailwindcss').Config} */
const token = name => `rgb(var(--${name}) / <alpha-value>)`

// Style "registre" : grille et filets, zéro arrondi (hors pastilles), un seul accent vermillon
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    borderRadius: { none: '0', DEFAULT: '0', full: '9999px' },
    extend: {
      colors: {
        canvas: token('bg'),
        surface: token('surface'),
        elevated: token('elevated'),
        fg: { DEFAULT: token('fg'), 2: token('fg-2'), 3: token('fg-3') },
        rule: { DEFAULT: 'var(--rule)', subtle: 'var(--rule-subtle)', strong: 'var(--rule-strong)' },
        accent: { DEFAULT: token('accent'), fg: token('accent-fg') },
        success: token('success'),
        danger: token('danger'),
        warning: token('warning'),
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { title: '-0.025em', label: '0.08em' },
      transitionTimingFunction: { swiss: 'cubic-bezier(.4,0,.2,1)' },
    },
  },
  plugins: [],
}
