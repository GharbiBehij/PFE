# Travel Lifestyle Design System Extract

This folder is a copy-paste extraction of the implemented visual system in this codebase.

## What was extracted

- Concrete brand tokens (customer and reseller flows)
- Tailwind extension object with colors, radii, shadows, gradients
- Reusable class recipes copied from real screen patterns
- Minimal React primitives using those recipes
- Motion presets matching common screen animations and press interactions

## Files

- design-tokens.css: CSS variable tokens and raw CSS utility classes
- tailwind-theme.extend.ts: Theme extension object for Tailwind config
- class-recipes.ts: Reusable className recipes used by screens
- components.tsx: Copy-paste primitive React components
- motion-presets.ts: Motion and interaction presets used in page transitions and buttons/cards
- ui-rules.ts: Canonical UI rule definitions and relationship spacing token map
- react-shim.d.ts: Lightweight JSX type shim for standalone extraction folders

## Quick integration

1. Copy this full folder into your app.
2. If you use Tailwind, merge travelLifestyleTheme into your Tailwind theme.extend.
3. If you do not use Tailwind, import design-tokens.css and build with the ds-* CSS classes.
4. Use DSButton, DSInput, DSCard, DSHeader to start composing screens.

## UI Rules

- Card = surface + padding lg + radius card + shadow medium
- Section spacing = xl
- Screen spacing = xxl
- Group spacing = lg
- Element spacing = sm | md2

Relationship rule:
If same concept -> small spacing
If same component -> medium spacing
If different component -> large spacing
If different section -> extra large spacing

Design-system mapping used in this extract:
- sm = 8px
- md2 = 12px
- lg = 16px
- xl = 24px
- xxl = 32px

Code mapping:
- class-recipes.ts has the class-level rules in dsUiRule and relation* classes
- ui-rules.ts has token-level rule definitions
- components.tsx provides DSScreen, DSSection, DSGroup, DSStack(relation)

## Tailwind merge example

import { travelLifestyleTheme } from "./design-system-extract/tailwind-theme.extend";

export default {
  theme: {
    extend: {
      colors: travelLifestyleTheme.colors,
      borderRadius: travelLifestyleTheme.borderRadius,
      boxShadow: travelLifestyleTheme.boxShadow,
      backgroundImage: travelLifestyleTheme.backgroundImage,
      spacing: travelLifestyleTheme.spacing,
    },
  },
};

## Behavioral style notes

- Page base: gray-50 background, white cards, gray text hierarchy
- Primary actions: violet background and white label
- High-priority actions: yellow CTA with dark label and soft yellow shadow
- Hero sections: violet to indigo diagonal gradient
- Shape language: rounded-xl and rounded-2xl for controls, rounded-3xl for cards and bottom nav
- Motion language: slight entry fades/slides and tap scale to 0.98 for buttons/cards

## Dependencies used in the original app

- react
- tailwindcss
- motion (motion/react)
- lucide-react
:root {
  --ds-bg-page: #f9fafb;
  --ds-bg-surface: #ffffff;
  --ds-bg-muted: #f3f4f6;
  --ds-bg-soft-primary: #ede9fe;
  --ds-bg-soft-accent: #fef9c3;

  --ds-text-primary: #1f2937;
  --ds-text-secondary: #4b5563;
  --ds-text-muted: #6b7280;
  --ds-text-inverse: #ffffff;

  --ds-brand-primary: #7c3aed;
  --ds-brand-primary-strong: #6d28d9;
  --ds-brand-secondary: #4338ca;
  --ds-brand-accent: #facc15;

  --ds-state-success: #16a34a;
  --ds-state-warning: #ca8a04;
  --ds-state-danger: #ef4444;
  --ds-state-info: #2563eb;

  --ds-border-soft: #f3f4f6;
  --ds-border-default: #e5e7eb;
  --ds-border-strong: #d1d5db;

  --ds-space-sm: 0.5rem;
  --ds-space-md2: 0.75rem;
  --ds-space-lg: 1rem;
  --ds-space-xl: 1.5rem;
  --ds-space-xxl: 2rem;

  --ds-radius-sm: 0.75rem;
  --ds-radius-md: 1rem;
  --ds-radius-lg: 1.5rem;
  --ds-radius-card: 1rem;
  --ds-radius-sheet: 36px;
  --ds-radius-hero: 40px;

  --ds-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --ds-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --ds-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --ds-shadow-float: 0 -4px 20px -5px rgba(0, 0, 0, 0.1);
  --ds-shadow-float-strong: 0 -10px 30px -10px rgba(0, 0, 0, 0.1);

  --ds-gradient-primary: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%);
  --ds-gradient-accent: linear-gradient(90deg, #facc15 0%, #eab308 100%);

  --ds-card-surface: var(--ds-bg-surface);
  --ds-card-padding: var(--ds-space-lg);
  --ds-card-radius: var(--ds-radius-card);
  --ds-card-shadow: var(--ds-shadow-md);
}

.ds-page {
  min-height: 100vh;
  background: var(--ds-bg-page);
  color: var(--ds-text-primary);
}

.ds-surface {
  background: var(--ds-bg-surface);
  border: 1px solid var(--ds-border-soft);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-sm);
}

/* UI Rule: Card = surface + padding lg + radius card + shadow medium */
.ds-card {
  background: var(--ds-card-surface);
  border: 1px solid var(--ds-border-soft);
  padding: var(--ds-card-padding);
  border-radius: var(--ds-card-radius);
  box-shadow: var(--ds-card-shadow);
}

.ds-hero {
  color: var(--ds-text-inverse);
  background: var(--ds-gradient-primary);
  border-radius: 0 0 var(--ds-radius-lg) var(--ds-radius-lg);
}

.ds-button-primary {
  border: 0;
  border-radius: var(--ds-radius-md);
  background: var(--ds-brand-primary);
  color: var(--ds-text-inverse);
  box-shadow: var(--ds-shadow-lg);
}

.ds-button-accent {
  border: 0;
  border-radius: var(--ds-radius-md);
  background: var(--ds-brand-accent);
  color: #111827;
  box-shadow: var(--ds-shadow-lg);
}

.ds-input {
  width: 100%;
  border: 1px solid var(--ds-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-bg-page);
  color: var(--ds-text-primary);
  padding: 0.875rem 1rem;
}

.ds-input:focus-visible {
  outline: 0;
  border-color: var(--ds-brand-primary);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2);
}

/* Relationship spacing rule */
.ds-rel-same-concept {
  gap: var(--ds-space-sm);
}

.ds-rel-same-component {
  gap: var(--ds-space-md2);
}

.ds-rel-different-component {
  gap: var(--ds-space-lg);
}

.ds-rel-different-section {
  gap: var(--ds-space-xl);
}
