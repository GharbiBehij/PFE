import { typography } from './typography';
import { shadows } from './shadows';
import { sizes } from './sizes';
import { radii, spacing } from './spacing';
import { colors } from './colors';
import { patterns } from './patterns';
import { Animation } from './animation';
import { zIndex } from './zIndex';

// src/theme/index.ts
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radii, layoutSpacing, borderRadius } from './spacing';
export { shadows } from './shadows';
export { sizes } from './sizes';
export { patterns } from './patterns';
export { Animation } from './animation'; // NEW
export { zIndex } from './zIndex';       // NEW

// Export everything as theme object
export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  sizes,
  patterns,
  Animation,
  zIndex,
} as const;