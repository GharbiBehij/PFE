export const COUNTRY_IMAGES: Record<string, string> = {
  // Europe
  France: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  Spain: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800',
  Italy: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800',
  Germany: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
  'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  Greece: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
  Portugal: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
  Netherlands: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800',
  Switzerland: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  Austria: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800',

  // Asia
  Japan: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800',
  Thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  Singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
  'South Korea': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800',
  China: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
  India: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
  UAE: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',

  // Americas
  USA: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800',
  Canada: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
  Mexico: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800',
  Brazil: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',

  // Oceania
  Australia: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800',
  'New Zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800',

  // Africa
  'South Africa': 'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=800',
  Morocco: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
};

export const DEFAULT_COUNTRY_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

export function getCountryImage(country: string): string {
  return COUNTRY_IMAGES[country] || DEFAULT_COUNTRY_IMAGE;
}
