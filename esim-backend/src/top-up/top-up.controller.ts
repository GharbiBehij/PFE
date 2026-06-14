import {
  Controller,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuditLayer, AuditTrigger, Role, SystemEvent } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { TopUpResponseDto } from './dto/top-up-response.dto';
import { JwtAuthGuard } from 'src/auth/Guards/JwtAuthGuard';
import { RolesGuard } from 'src/auth/Guards/roles.guard';
import { Roles } from 'src/auth/Decoraters/roles.decorator';
import { IdempotencyGuard } from 'src/Common/guards/idempotency.guard';
import { AuditLogService } from 'src/AuditLog/AuditLog.service';
import { TopUpService } from './top-up.service';

@ApiTags('top-up')
@Controller('top-up')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopUpController {
  constructor(
    private readonly TopUpService: TopUpService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @UseGuards(IdempotencyGuard)
  @Roles(Role.SALESMAN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reseller initiates a wallet top-up request' })
  @ApiResponse({ status: 201, type: TopUpResponseDto })
  async initiateTopUp(
    @Body() dto: CreateTopUpDto,
    @Req() req: Request,
  ): Promise<TopUpResponseDto> {
    const salesmanId = (req.user as any).userId;
    const startedAt = Date.now();

    const result = await this.TopUpService.initiateTopUp(dto, salesmanId);

    await this.auditLogService.log({
      userId: salesmanId,
      transactionId: result.topUpRequestId,
      layer: AuditLayer.WALLET,
      event: SystemEvent.TOP_UP_INITIATED,
      toStatus: result.status,
      triggeredBy: AuditTrigger.USER,
      startedAt,
      message: `Top-up of ${dto.amount} TND initiated via ${dto.paymentMethod}`,
      details: {
        topUpRequestId: result.topUpRequestId,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
      },
    });

    return result;
  }

  @Patch(':id/confirm-cash')
  @UseGuards(IdempotencyGuard)
  @Roles(Role.ZONE_CHIEF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Zone chief confirms cash top-up receipt' })
  @ApiResponse({ status: 200 })
  async confirmCash(
    @Param('id', ParseIntPipe) topUpRequestId: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const zoneChiefId = (req.user as any).userId;
    const startedAt = Date.now();

    await this.TopUpService.confirmCash(topUpRequestId, zoneChiefId);

    await this.auditLogService.log({
      userId: zoneChiefId,
      transactionId: topUpRequestId,
      layer: AuditLayer.WALLET,
      event: SystemEvent.TOP_UP_CASH_CONFIRMED,
      toStatus: 'APPROVED',
      triggeredBy: AuditTrigger.USER,
      startedAt,
      message: `Zone chief ${zoneChiefId} confirmed cash receipt for top-up #${topUpRequestId}`,
      details: { topUpRequestId, zoneChiefId },
    });

    return {
      message:
        'Paiement en especes confirme - portefeuille en cours de recharge',
    };
  }
}
