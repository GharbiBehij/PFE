import { useQuery } from '@tanstack/react-query';
import { offersApi } from '../../api/offers.api';
import type { Offer } from '../../types/offer';

// Returns the ISO week number of the year (1–53).
// Same value for all users in a given week → deterministic rotation.
const getISOWeekNumber = (): number => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
  return Math.floor(dayOfYear / 7);
};

export const useFeaturedOffer = () => {
  return useQuery({
    queryKey: ['reseller', 'featuredOffer'],
    queryFn: async (): Promise<Offer | null> => {
      const offers = await offersApi.getPopular();
      if (!offers.length) return null;
      // Rotate through the pool: changes every week, same offer for all users
      const weekIndex = getISOWeekNumber() % offers.length;
      return offers[weekIndex];
    },
    staleTime: 6 * 60 * 60 * 1000, // 6h — offer won't change within a week
  });
};
