import { Injectable } from '@nestjs/common';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { EsimTopupDto } from '../esim/dto/esim-topup.dto';
@Injectable()
export class TopUpService {
  constructor(private readonly TopUpOrchestrator: TopUpOrchestrator) {}

  //Top Reseller
  async initiateTopUp(dto: CreateTopUpDto, salesmanId: number) {
    return this.TopUpOrchestrator.initiateTopUp(dto, salesmanId);
  }
  async confirmCash(topUpRequestId: number, zoneChiefId: number) {
    await this.TopUpOrchestrator.confirmCash(topUpRequestId, zoneChiefId);
  }
  //Top B2C client for data
  async topupEsim(esimId: number, dto: EsimTopupDto, userId: number) {
    return this.TopUpOrchestrator.topupEsim(esimId, dto, userId);
  }
  async getTopupOffers(esimId: number, userId: number) {
    return this.TopUpOrchestrator.getTopupOffers(esimId, userId);
  }
}
