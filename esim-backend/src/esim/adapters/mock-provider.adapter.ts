import { Injectable } from '@nestjs/common';
import {
  ProviderAdapter,
  CreateEsimResponse,
  ProviderStatusResponse,
  TopupEsimResponse,
} from '../interfaces/provider-adapter.interface';
import { CreateEsimDto } from './create-esim.dto';
import { createHash } from 'crypto';

@Injectable()
export class MockProviderAdapter implements ProviderAdapter {
  async createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const seed = `${dto.userId}-${dto.offerId}-${Date.now()}`;
    const hash = createHash('sha256')
      .update(seed)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase();

    const iccid = `89000${hash}`;

    const activationCode = `LPA:1$${dto.offerId}.mock.netyfly.com$${hash}`;

    const expiryDate = new Date(
      Date.now() + dto.validityDays * 24 * 60 * 60 * 1000,
    );

    return { iccid, activationCode, expiryDate };
  }

  async getStatus(iccid: string): Promise<ProviderStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      status: 'SUCCESS',
      message: `Mock activation confirmed for eSIM ${iccid}`,
    };
  }

  async cancelEsim(_iccid: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // no-op in mock
  }

  async deactivateEsim(_iccid: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // no-op in mock
  }

  async topupEsim(iccid: string, _offerId: string): Promise<TopupEsimResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      iccid,
      addedData: 1024,
      newExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'SUCCESS',
      message: 'Data added successfully',
    };
  }
}
