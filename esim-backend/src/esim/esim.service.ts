import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateEsimDto } from './adapters/create-esim.dto';
import { UpdateEsimDto } from './dto/update-esim.dto';
import { EsimRepository } from './esim.repository';
import { ProviderAdapter } from './interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { TransactionRepository } from 'src/transaction/transaction.repository';
import { EsimStatus, EsimEventStatus, TransactionStatus } from '@prisma/client';

@Injectable()
export class EsimService {
  constructor(
    private readonly esimRepository: EsimRepository,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly transactionRepository: TransactionRepository,
  ) { }

  async create(
    dto: CreateEsimDto,
    userId: number,
    transactionId: number,
    providerId: number,
  ) {
    try {
      const transaction = await this.transactionRepository.findOne(transactionId);
      if (!transaction) {
        throw new NotFoundException('Transaction Not found');
      }

      // Idempotency: if eSIM already created for this transaction, return it
      const existingEsim = await this.esimRepository.findById(transactionId);
      if (existingEsim) {
        return { success: true, esim: existingEsim };
      }

      const esimData = await this.providerAdapter.createEsim(dto);

      const esim = await this.esimRepository.createAndLinkTransaction(
        {
          iccid: esimData.iccid,
          activationCode: esimData.activationCode,
          transactionId,
          expiryDate: esimData.expiryDate,
          status: EsimStatus.NOT_ACTIVE,
          event: EsimEventStatus.PROVISIONING_STARTED,
          userId,
          providerId,
        },
        transactionId,
      );

      return { success: true, esim };

    } catch (error: any) {
      if (error.isTimeout || error?.status >= 500) {
        throw new Error('Transient Provider Error');
      }

      await this.transactionRepository.updateStatus(transactionId, TransactionStatus.FAILED);
      return { success: false, terminal: true, error: error?.message };
    }
  }

  findById(id: number) {
    return this.esimRepository.findById(id);
  }

  findAll() {
    return `This action returns all esim`;
  }

  findOne(id: number) {
    return `This action returns a #${id} esim`;
  }

  UpdateEsim(id: number, dto: UpdateEsimDto) {
    return this.esimRepository.UpdateEsim(id, dto);
  }

  remove(id: number) {
    return `This action removes a #${id} esim`;
  }
}
