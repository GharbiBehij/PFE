# eSIM Mobile Design System Snapshot

This document captures the design currently applied in the React Native app.
Use this as the source of truth for visual refactors without changing logic or architecture.

## Source Of Truth Files
- src/theme/colors.ts
- src/theme/spacing.ts
- src/theme/typography.ts
- src/theme/shadows.ts
- src/screens/home/HomeScreen.tsx
- src/screens/esims/MyEsimsScreen.tsx
- src/screens/offers/PackageDetailScreen.tsx
- src/screens/payment/PaymentScreen.tsx
- src/navigation/MainTabs.tsx
- src/components/CoverageFilterChips.tsx

## Design Tokens

### Colors
- primary: #7C3AED
- primaryLight: #8B5CF6
- primaryDark: #6D28D9
- primaryBg: #F5F3FF
- primaryContainer: #EDE9FE
- secondary: #FACC15
- secondaryDark: #FBBF24
- background: #FAFAFA
- surface: #FFFFFF
- surfaceMuted: #F3F4F6
- divider: #E5E7EB
- border: #E5E7EB
- textPrimary: #111827
- textSecondary: #6B7280
- textTertiary: #9CA3AF
- textOnPrimary: #FFFFFF
- error: #EF4444
- success: #10B981
- warning: #F59E0B

### Spacing
- xs: 4
- sm: 8
- md: 12
- lg: 16
- xl: 24
- xxl: 32
- xxxl: 48

### Radii
- card: 24
- button: 16
- input: 12
- badge: 8

### Typography
- titleXL: 32 / 700 / lineHeight 38
- titleLG: 26 / 700 / lineHeight 32
- titleMD: 22 / 700 / lineHeight 28
- titleSM: 18 / 600 / lineHeight 24
- bodyLG: 16 / 400 / lineHeight 24
- bodyMD: 14 / 400 / lineHeight 20
- bodySM: 12 / 400 / lineHeight 18
- label: 14 / 600 / lineHeight 18

### Shadows
- low: y=1, opacity=0.05, radius=4, elevation=1
- medium: y=2, opacity=0.08, radius=8, elevation=3
- high: y=4, opacity=0.12, radius=14, elevation=6

## Layout Recipes Applied

### App background
- Global screen background uses `colors.background` (#FAFAFA).

### Gradient header shell
- Used in Home, MyEsims, PackageDetail, Payment.
- Gradient: [surface -> primaryBg].
- Rounded bottom corners (24 or 32 depending on screen).
- Default shadow: medium.
- Internal rhythm:
  - top row with title block + right action/count pill
  - section spacing via `spacing.md` and `spacing.lg`

### Section header row
- Pattern: title on left, meta action/count on right.
- Title style: `typography.titleSM` + `textPrimary`.
- Right text often `bodyMD`, weight 600, color `primary`.

### Card surface
- White surface + border + rounded corners.
- Common combinations:
  - radius 24 + border + medium/low shadow
  - state cards radius 16 + border + low shadow

### Sticky bottom action bar
- Used in PackageDetail and Payment.
- Absolute at bottom with `bottom: 0`.
- White surface, top border, high shadow.
- Contains price/total area + main CTA.

### Bottom nav bar
- Full-width floating shell style in MainTabs:
  - surface background, top border
  - top-left/top-right radius 24
  - height 82
  - bottom 0, absolute
  - soft top shadow (negative Y offset)
- Hidden on nested routes; visible on stack roots.

## Interaction States Applied

### Pressed state pattern
- Scale down to `0.98`.
- Swap background to `surfaceMuted` for neutral controls.
- Reduce elevation from medium/high to low where needed.

### Back/icon button press
- In PackageDetail and Payment headers:
  - default: white circular button with border
  - pressed: `surfaceMuted` + scale 0.98 + low shadow

### Primary secondary CTA press
- Secondary yellow CTA buttons (payment actions):
  - default background: `secondary`
  - pressed background: `secondaryDark`
  - pressed transform: scale 0.98

### Active chip/tab state
- Active uses `primaryContainer` background + `primary` text/border.
- Inactive uses white/surface or muted background + secondary text.

## Inputs And Search Field Pattern
- Search/input surfaces use:
  - background: `surfaceMuted`
  - border: `border`
  - rounded radius around 12-14
  - icon on left + input text in `bodyMD`

## Motion Pattern Applied
- Uses react-native-reanimated only.
- Common transitions:
  - FadeIn/FadeOut around 120-140ms for small UI toggles
  - FadeInDown around 280ms for list reveal
  - Stagger by index with delay near 50ms

## Coherence Rules To Preserve
- Keep tokens from src/theme only; avoid hardcoded one-off values unless already present.
- Keep white cards on gray app background.
- Keep gradient headers + section headers + state cards structure.
- Keep bottom conversion actions in sticky footer, not in headers.
- Keep pressed feedback on interactive elements (scale + color/elevation change).
- Keep icon containers soft and rounded for visual consistency.

## Claude Prompt Snippet
Use this summary when asking Claude for style changes:

"Use DESIGN_SYSTEM_SNAPSHOT.md as strict visual reference. Keep component structure and logic unchanged. Apply only style changes using existing tokens (colors/spacing/typography/shadows). Match current patterns: gradient header shell, section header row, white rounded cards (24), sticky bottom CTA bar, pressed feedback (scale 0.98 + muted background/shadow low), and active states with primaryContainer + primary."