export interface Destination {
  id: string;
  country: string;
  countryCode: string;
  coverageType: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
  startingPrice: number;
  offerCount?: number;
  networkType?: string;
  Region: string;
}

export interface Offer {
  id: number;
  country: string;
  countryCode: string;
  dataVolume: string;
  validityDays: number;
  price: number;
  currency: string;
  providerId: string;
  description?: string;
  popularity?: number;
  networkType?: string;
}

export type PlanType = 'data' | 'days';
