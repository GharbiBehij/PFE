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
  getStatus(iccid: string): Promise<ProviderStatusResponse>;
  cancelEsim(iccid: string): Promise<void>;
  deactivateEsim(iccid: string): Promise<void>;
}
