export interface CreateEsimDto {
  transactionId: number;
  offerId: number;
  country: string;
  dataVolume: number;    // MB
  validityDays: number;
  providerId: number;
  userId: number;
}
