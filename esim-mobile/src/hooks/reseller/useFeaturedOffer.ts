import { useQuery } from '@tanstack/react-query';
import { offersApi } from '../../api/offers.api';
import type { Offer } from '../../types/offer';

export const useFeaturedOffer = () => {
  return useQuery({
    queryKey: ['reseller', 'featuredOffer'],
    queryFn: async (): Promise<Offer | null> => {
      const offers = await offersApi.getPopular();
      return offers[0] ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 min — offers don't change often
  });
};
