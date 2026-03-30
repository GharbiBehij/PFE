import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEsimDto } from './adapters/create-esim.dto';
import { UpdateEsimDto } from './dto/update-esim.dto';
import { EsimRepository } from './esim.repository';
import { MockProviderAdapter } from './adapters/mock-provider.adapter';
import { TransactionRepository } from 'src/transaction/transaction.repository';
import { EsimStatus, EsimEventStatus, TransactionStatus } from '@prisma/client';
import { SalesmanContext } from 'src/Common/Interfaces/salesman';
@Injectable()
export class EsimService {
  constructor(
    private readonly esimRepository: EsimRepository,
    private readonly providerAdapter: MockProviderAdapter,
    private readonly transactionRepository: TransactionRepository,
  ) { }

  async create(
    dto: CreateEsimDto,
    userId: number,
    transactionId: number,
    providerId: number,
    salesmanId: number,
  ) {
    try {
      // 1. Check the transaction ID
      const transaction = await this.transactionRepository.findOne(transactionId);
      if (!transaction) {
        throw new NotFoundException('Transaction Not found');
      }

      // 2. If it already has an eSIM, return it safely
      if (transaction.esimId) {
        const existingEsim = await this.esimRepository.findById(transaction.esimId);
        return { success: true, esim: existingEsim };
      }

      // 3. API call to the eSIM provider 
      const esimData = await this.providerAdapter.createEsim(dto);

      // 4. Creation and linking (Passing 2 arguments explicitly)
      const esim = await this.esimRepository.createAndLinkTransaction(
        {
          iccid: esimData.iccid,
          activationCode: esimData.activationCode,
          expiryDate: esimData.expiryDate || new Date(), // Handle missing dates from mock
          activatedAt: new Date(), // Required by schema
          status: EsimStatus.NOT_ACTIVE,
          event: EsimEventStatus.PROVISIONING_SUCCESS, // Required by schema
          userId: userId,
          providerId: providerId,
        },
        transactionId
      );

      return { success: true, esim };

    } catch (error: any) { // Lowercase 'error' to prevent shadowing global Error
      if (error.isTimeout || error.status >= 500) {
        throw new Error('Transient Provider Error');
      }

      // Update transaction status using the correct Enum, not the error message
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