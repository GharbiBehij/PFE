import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { B2CPurchaseDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/Guards/JwtAuthGuard';
import { IdempotencyGuard } from '../Common/guards/idempotency.guard';
import { REDIS_CLIENT } from '../Common/redis.provider';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { EsimPurchaseOrchestrator } from '../Orchestrators/EsimPurchaseOrchestrator';
import { userService } from '../user/user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PurchaseResponseDto,
  TransactionDetailResponseDto,
  TransactionListResponseDto,
} from './dto/transaction-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { OfferService } from '../offer/offer.service';

const IDEMPOTENCY_TTL_SECONDS = 30;

@ApiTags('transactions')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly purchaseOrchestrator: EsimPurchaseOrchestrator,
    private readonly userService: userService,
    private readonly offerService: OfferService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @Post('purchase')
  @ApiOperation({
    summary: 'Purchase an eSIM offer for authenticated customer',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 201, type: PurchaseResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Purchase failed',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
    type: ErrorResponseDto,
  })
  async purchaseB2C(@Body() dto: B2CPurchaseDto, @Req() req: Request) {
    const userId = (req.user as any).userId;

    const user = await this.userService.findById(userId);
    if (!user) {
      return { status: 'FAILED', message: 'User not found' };
    }
    const offer = await this.offerService.findbyId(dto.offerId);
    if (!offer) {
      return { status: 'FAILED', message: 'Offer not found' };
    }

    const result = await this.purchaseOrchestrator.purchaseEsim(
      {
        offerId: dto.offerId,
        amount: offer.price,
        currency: 'TND',
        channel: 'B2C',
        paymentMethod: dto.paymentMethod as any,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        passportId: user.passportId ?? '',
        userId: user.id,
        status: 'PENDING',
        activateNow: dto.activateNow,
      },
      userId,
    );

    // Store result in Redis so duplicate requests within TTL
    // get the cached response instead of re-processing
    if ((req as any).idempotencyKey) {
      await this.redis.set(
        (req as any).idempotencyKey,
        JSON.stringify(result),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
      );
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get authenticated user transactions' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: TransactionListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  getMine(@Req() req: Request) {
    return this.transactionService.getUserTransactions(
      (req.user as any).userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get authenticated user transaction detail' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: Number, example: 9001 })
  @ApiResponse({ status: 200, type: TransactionDetailResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
    type: ErrorResponseDto,
  })
  getById(@Req() req: Request, @Param('id') id: string) {
    return this.transactionService.getTransactionDetail(
      (req.user as any).userId,
      +id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a purchased eSIM after payment (B2C)' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: Number, example: 9001 })
  @ApiResponse({ status: 201, description: 'Activation initiated' })
  @ApiResponse({
    status: 400,
    description: 'Transaction not in PAID status',
    type: ErrorResponseDto,
  })
  async activateEsim(@Req() req: Request, @Param('id') id: string) {
    return this.purchaseOrchestrator.activateAfterPayment(
      +id,
      (req.user as any).userId,
    );
  }

  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @Post(':id/refund')
  @ApiOperation({ summary: 'Request a refund for a transaction' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', type: Number, example: 9001 })
  @ApiResponse({ status: 201, description: 'Refund issued' })
  @ApiResponse({
    status: 403,
    description: 'Refund policy check failed',
    type: ErrorResponseDto,
  })
  async requestRefund(@Req() req: Request, @Param('id') id: string) {
    return this.transactionService.requestRefund(
      Number(id),
      (req.user as any).userId,
    );
  }
}
