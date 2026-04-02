import { Injectable } from '@nestjs/common';
import { ProviderAdapter, CreateEsimResponse, ProviderStatusResponse } from '../interfaces/provider-adapter.interface';
import { CreateEsimDto } from './create-esim.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class MockProviderAdapter implements ProviderAdapter {
  async createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const iccid = '8900000000' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const activationCode = 'LPA:1$smdp.plus.com$' + randomBytes(8).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + dto.validityDays);

    return { iccid, activationCode, expiryDate };
  }

  async getStatus(iccid: string): Promise<ProviderStatusResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const statuses: Array<'SUCCESS' | 'FAILED' | 'PENDING'> = ['SUCCESS', 'FAILED', 'PENDING'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      status,
      message: `Mock provider status for eSIM ${iccid}`,
    };
  }

  async cancelEsim(_iccid: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // no-op in mock
  }

  async deactivateEsim(_iccid: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // no-op in mock
  }
}
