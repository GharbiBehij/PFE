export interface Destination {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  imageUrl?: string;
  startingPrice: number;
  coverageType: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
}

export interface Offer {
  id: string;
  country: string;
  countryCode: string;
  dataVolume: string;
  validityDays: number;
  price: number;
  currency: string;
  providerId: string;
  description?: string;
  popularity?: number;
}

export type PlanType = 'data' | 'days';
