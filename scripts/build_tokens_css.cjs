const fs = require('fs');

const css = fs.readFileSync('content-audit/static/css/fc1ff755c46d4fce.css', 'utf8');

// Let's create the locked tokens.css with all exact CSS custom properties and theme tokens
const tokensCss = `/**
 * Global to Local — Design Tokens (Read-Only)
 * Extracted directly from live production CSS (fc1ff755c46d4fce.css)
 * Precedence Rule: Look, copy, content, and colors are locked.
 */

:root {
  /* Brand and Semantic Colors */
  --color-ground: #F7F0E2;              /* rgb(247, 240, 226) - warm cream background */
  --color-ground-alt: #FBF6EB;          /* rgb(251, 246, 235) - light cream */
  --color-surface: #FFFFFF;             /* #ffffff - pure white card background */
  --color-surface-muted: #F4E8D0;       /* rgb(244, 232, 208) - cream section tone */
  --color-surface-tint: #ECE0C8;        /* subtle warm border/tint */
  
  --color-palm: #1C393F;                /* rgb(28, 57, 63) - Goan palm green */
  --color-palm-shade: #17332D;          /* deep palm green */
  --color-ink-deep: #12262B;            /* rgba(18, 38, 43, 1) - dark ink */
  
  --color-accent: #C45C4A;              /* rgb(196, 92, 74) - Goan terracotta / red-clay */
  --color-accent-hover: #B04F3E;        /* darker terracotta */
  --color-accent-soft: rgba(196, 92, 74, 0.12);
  
  --color-content: #2A221C;             /* rgb(42, 34, 28) - deep brown-black text */
  --color-content-muted: #6B625B;       /* secondary text */
  --color-content-subtle: #8C827A;      /* caption text */
  --color-content-ondark: #F7F0E2;      /* cream text on dark backgrounds */
  --color-content-ondark-muted: rgba(247, 240, 226, 0.72);
  
  --color-border: #D4C2A4;              /* rgb(212, 194, 164) - natural cane border */
  --color-border-subtle: rgba(212, 194, 164, 0.45);
  --color-border-ondark: rgba(247, 240, 226, 0.25);

  /* Typography */
  --font-display: "Fraunces", "Fraunces Fallback", Georgia, serif;
  --font-sans: "Source Sans 3", "Source Sans 3 Fallback", system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Font Sizes and Line Heights */
  --text-micro: 0.6875rem;              /* 11px */
  --text-xs: 0.75rem;                   /* 12px */
  --text-sm: 0.875rem;                  /* 14px */
  --text-base: 1rem;                    /* 16px */
  --text-lg: 1.125rem;                  /* 18px */
  --text-xl: 1.25rem;                   /* 20px */
  --text-2xl: 1.5rem;                   /* 24px */
  --text-3xl: 1.875rem;                 /* 30px */
  --text-4xl: 2.25rem;                  /* 36px */
  --text-5xl: 3rem;                     /* 48px */
  --text-display: clamp(2.85rem, 6.4vw, 5.1rem);
  --text-h1: clamp(2.2rem, 4.5vw, 3.5rem);
  --text-h2: clamp(1.65rem, 3.2vw, 2.4rem);
  --text-h3: clamp(1.15rem, 1.6vw, 1.35rem);

  /* Layout and Spacing */
  --max-w-shell: 1320px;
  --max-w-wide: 1520px;
  --max-w-narrow: 768px;
  --py-section: 72px;
  --py-section-lg: 104px;

  /* Border Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(18, 38, 43, 0.05);
  --shadow-md: 0 4px 12px -2px rgba(18, 38, 43, 0.08);
  --shadow-lg: 0 10px 24px -4px rgba(18, 38, 43, 0.12);
  --shadow-xl: 0 20px 32px -8px rgba(18, 38, 43, 0.16);

  /* Motion and Easing */
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --duration-hero: 1200ms;
}

/* Base Body Styles */
body {
  background-color: var(--color-ground);
  color: var(--color-content);
  font-family: var(--font-sans);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-content);
}
`;

fs.writeFileSync('tokens.css', tokensCss, 'utf8');
fs.writeFileSync('content-audit/tokens.css', tokensCss, 'utf8');
console.log('Saved tokens.css');
