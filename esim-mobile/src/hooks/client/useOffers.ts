import { useQuery } from '@tanstack/react-query';
import { offersApi } from '../../api/offers.api';

export const useDestinations = () =>
  useQuery({
    queryKey: ['destinations'],
    queryFn: offersApi.getDestinations,
  });

export const usePopularOffers = () =>
  useQuery({
    queryKey: ['offers', 'popular'],
    queryFn: offersApi.getPopular,
  });

export const useOffersByCountry = (country: string, coverageType?: 'LOCAL' | 'REGIONAL' | 'GLOBAL') =>
  useQuery({
    queryKey: ['offers', country, coverageType],
    queryFn: () => {
      if (coverageType === 'REGIONAL') {
        return offersApi.getOffers(undefined, country, 'REGIONAL');
      }
      if (coverageType === 'GLOBAL') {
        return offersApi.getOffers(undefined, undefined, 'GLOBAL');
      }
      return offersApi.getOffers(country);
    },
    enabled: country.trim().length > 0,
    staleTime : 1000 * 60 * 5
   
  });

export const useOfferDetail = (id: string) =>
  useQuery({
    queryKey: ['offers', id],
    queryFn: () => offersApi.getById(id),
    enabled: id.trim().length > 0,
  });

export const useSearchOffers = (query: string) =>
  useQuery({
    queryKey: ['offers', 'search', query],
    queryFn: () => offersApi.search(query),
    enabled: query.trim().length > 0,
  });
