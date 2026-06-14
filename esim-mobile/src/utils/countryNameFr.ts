import { normalizeCountryCode } from './countryCode';

const FR_NAMES: Record<string, string> = {
  TN: 'Tunisie',         FR: 'France',          US: 'États-Unis',
  GB: 'Royaume-Uni',     AE: 'Émirats arabes unis',
  JP: 'Japon',           TR: 'Turquie',         DE: 'Allemagne',
  IT: 'Italie',          ES: 'Espagne',         PT: 'Portugal',
  MA: 'Maroc',           EG: 'Égypte',          CA: 'Canada',
  CN: 'Chine',           SA: 'Arabie saoudite', BE: 'Belgique',
  NL: 'Pays-Bas',        CH: 'Suisse',          GR: 'Grèce',
  TH: 'Thaïlande',       SG: 'Singapour',       AU: 'Australie',
};

export const countryNameFr = (code: string | undefined | null, fallback: string): string => {
  if (!code) return fallback;
  return FR_NAMES[normalizeCountryCode(code)] ?? fallback;
};
