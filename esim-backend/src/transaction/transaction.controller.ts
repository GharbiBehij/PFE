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
import {
  B2CPurchaseDto,
  CreateTransactionDto,
} from './dto/create-transaction.dto';
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
  TransactionDetailCoreDto,
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
        currency: 'USD',
        channel: 'B2C',
        paymentMethod: dto.paymentMethod as any,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        passportId: user.passportId ?? '',
        userId: user.id,
        status: 'PENDING',
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

  // Legacy endpoint — no idempotency guard (no financial operation)
  @Post()
  @ApiOperation({ summary: 'Legacy transaction create endpoint' })
  @ApiResponse({ status: 201, type: TransactionDetailCoreDto })
  @ApiResponse({
    status: 404,
    description: 'Offer not found',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionService.createInitial(dto, dto.userId);
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
}