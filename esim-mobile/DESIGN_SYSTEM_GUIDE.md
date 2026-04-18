# Design System Guide

This project uses `src/theme/*` as the single source of truth for UI design tokens.

## Canonical Token Sources

- Colors: `src/theme/colors.ts`
- Spacing + Radii: `src/theme/spacing.ts`
- Sizes: `src/theme/sizes.ts`
- Typography: `src/theme/typography.ts`
- Shadows: `src/theme/shadows.ts`
- Z-Index: `src/theme/zIndex.ts`
- Animation: `src/theme/animation.ts`

NativeBase theme values must be derived from these files via `src/config/nativebase-theme.ts`.

## Required Usage Rules

1. Never hardcode colors in UI files.
- Forbidden: `#7C3AED`, `rgba(...)`, `rgb(...)`
- Use: `colors.primary.DEFAULT`, `colors.text.primary`, `colors.status.active.background`

2. Never hardcode spacing/radius values.
- Forbidden: `padding: 13`, `borderRadius: 17`
- Use: `spacing.md`, `radii.lg`, `radii.full`

3. Use semantic tokens when possible.
- Prefer: `colors.status.failed.text`
- Avoid direct palette values when semantic intent exists.

4. Keep minimum touch target at 44.
- Use: `sizes.touch.sm` for min touch dimensions.

5. Interaction states are standardized.
- Pressed state: `transform: [{ scale: 0.98 }]`
- Primary press color: `colors.state.primaryPressed`
- Secondary press color: `colors.state.secondaryPressed`
- Surface press color: `colors.state.surfacePressed`

6. Status badges should use semantic status tokens.
- Use `colors.status.*` for background, text, and border.

## Interactive Accessibility Checklist

For all pressable controls:

- `accessibilityRole="button"`
- `accessibilityLabel` must describe action
- `accessibilityState` should include `selected` and/or `disabled` when relevant
- Ensure touch target >= `sizes.touch.sm`

## NativeBase Usage

NativeBase can be used for layout wrappers (`Box`, `HStack`, `VStack`, scroll wrappers), but avoid visual token strings in components.

- Prefer React Native `StyleSheet` with `src/theme/*` tokens.
- Avoid component-local palette strings like `"gray.200"` in app UI files.

## Guardrails

Run checks before merge:

- `npm run check:design-tokens` (report)
- `npm run check:design-tokens:strict` (fails on violations)

The check scans `src/components` and `src/screens` for:

- Hardcoded hex/rgb/rgba colors
- NativeBase palette strings (`"gray.200"`, `"primary.600"`)
- Legacy flat color tokens (`colors.textPrimary`, etc.)

## Migration Pattern

When refactoring a component:

1. Replace hardcoded/legacy color usage with nested `colors.*`.
2. Replace spacing/radius numbers with `spacing.*` / `radii.*`.
3. Add standardized pressed and accessibility states.
4. Keep business logic and navigation unchanged.
5. Validate with type checks and design token script.
