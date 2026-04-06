export interface CreateOfferDto {
    id: number;
    country: string;
    dataVolume: number;
    validityDays: number;
    price: number;
    title: string;
    description: string;
    InternalMargin: number
    providerId: number
}
