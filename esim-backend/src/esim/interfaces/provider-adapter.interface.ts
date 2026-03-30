// provider-adapter.interface.ts
import { CreateEsimDto } from '../adapters/create-esim.dto';

export interface CreateEsimResponse {
  iccid: string;
  activationCode: string;
  expiryDate: Date;
}

export interface ProviderStatusResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
}

export interface ProviderAdapter {
  createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse>;
  getStatus(transactionId: number): Promise<ProviderStatusResponse>; // ✅ added
}