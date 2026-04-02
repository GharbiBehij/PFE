import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionService } from 'src/transaction/transaction.service';
import { EsimProducer } from 'src/Queue/esim.producer';
import { EsimService } from 'src/esim/esim.service';
import { userService } from 'src/user/user.service';

export interface ActivateEsimDto {
    esimId: number;
    transactionId: number;
}

@Injectable()
export class EsimActivationOrchestrator {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly esimService: EsimService,
        private readonly esimProducer: EsimProducer,
        private readonly userService: userService,
    ) { }

    async activateEsim(dto: ActivateEsimDto, userId: number) {
        // 1. check user
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException(`User #${userId} not found`); // ✅ backticks
        }

        // 2. check transaction
        const transaction = await this.transactionService.findOne(dto.transactionId);
        if (!transaction) {
            throw new NotFoundException(`Transaction #${dto.transactionId} not found`);
        }

        // 3. check esim — only one call needed
        const esim = await this.esimService.findById(dto.esimId);
        if (!esim) {
            throw new NotFoundException(`eSIM #${dto.esimId} not found`);
        }

        // 4. make sure esim belongs to this transaction
        if (esim.transactionId !== dto.transactionId) {
            throw new BadRequestException(`eSIM #${dto.esimId} does not belong to Transaction #${dto.transactionId}`);
        }

        // 5. enqueue activation — worker handles provider call
        await this.esimProducer.enqueueActivation({
            transactionId: transaction.id,
            userId: user.id,
            iccid: esim.iccid,
            channel: transaction.channel,
        });

        return {
            transactionId: transaction.id,
            esimId: esim.id,
            message: 'ACTIVATION_SUCCEDED',
            status: 'SUCCEDED',
        };
       
    }
}