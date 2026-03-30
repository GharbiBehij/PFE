export interface CreateOfferDto {
    id: number;
    country: string;
    dataVolume: number;
    validityDays: number;
    price: number;
    InternalMargin: number
    providerId: number
}
