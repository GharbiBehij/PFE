/**
 * Normalise les codes pays non-ISO renvoyés par l'API.
 * Tunisia revient comme "TU" alors que l'ISO 3166-1 alpha-2 est "TN".
 */
const NON_ISO_MAP: Record<string, string> = {
  TU: 'TN',
  UK: 'GB',
  EN: 'GB',
};

export const normalizeCountryCode = (raw?: string | null): string => {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  return NON_ISO_MAP[upper] ?? upper;
};
