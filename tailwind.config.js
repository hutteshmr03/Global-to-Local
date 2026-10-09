/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: 'var(--color-ground)',
        'ground-alt': 'var(--color-ground-alt)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        'surface-tint': 'var(--color-surface-tint)',
        palm: 'var(--color-palm)',
        'palm-shade': 'var(--color-palm-shade)',
        'ink-deep': 'var(--color-ink-deep)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-soft': 'var(--color-accent-soft)',
        content: 'var(--color-content)',
        'content-muted': 'var(--color-content-muted)',
        'content-subtle': 'var(--color-content-subtle)',
        'content-ondark': 'var(--color-content-ondark)',
        'content-ondark-muted': 'var(--color-content-ondark-muted)',
        border: 'var(--color-border)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-ondark': 'var(--color-border-ondark)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        pill: '9999px',
      },
      maxWidth: {
        shell: '1320px',
        wide: '1520px',
        narrow: '768px',
      },
      padding: {
        'section': '72px',
        'section-lg': '104px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
