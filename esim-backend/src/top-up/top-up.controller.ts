import {
  Get,
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
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { TopUpResponseDto } from './dto/top-up-response.dto';
import { JwtAuthGuard } from 'src/auth/Guards/JwtAuthGuard';
import { RolesGuard } from 'src/auth/Guards/roles.guard';
import { Roles } from 'src/auth/Decoraters/roles.decorator';
import { EsimTopupDto } from '../esim/dto/esim-topup.dto';
import { EsimTopupOrchestrator } from '../Orchestrators/Esimtopup.orchestrator';

@ApiTags('top-up')
@Controller('top-up')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopUpController {
  constructor(private readonly topUpOrchestrator: TopUpOrchestrator) {}

  @Post()
  @Roles(Role.SALESMAN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reseller initiates a wallet top-up request' })
  @ApiResponse({ status: 201, type: TopUpResponseDto })
  async initiateTopUp(
    @Body() dto: CreateTopUpDto,
    @Req() req: Request,
  ): Promise<TopUpResponseDto> {
    const salesmanId = (req.user as any).userId;
    return this.topUpOrchestrator.initiateTopUp(dto, salesmanId);
  }

  @Patch(':id/confirm-cash')
  @Roles(Role.ZONE_CHIEF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Zone chief confirms cash top-up receipt' })
  @ApiResponse({ status: 200 })
  async confirmCash(
    @Param('id', ParseIntPipe) topUpRequestId: number,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const zoneChiefId = (req.user as any).userId;
    await this.topUpOrchestrator.confirmCash(topUpRequestId, zoneChiefId);
    return {
      message:
        'Paiement en especes confirme - portefeuille en cours de recharge',
    };
  }
}

@ApiTags('esim-top-up')
@Controller('esim')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EsimTopUpController {
  constructor(private readonly esimTopupOrchestrator: EsimTopupOrchestrator) {}

  @Post(':id/topup')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Top up data on an existing active eSIM' })
  @ApiParam({ name: 'id', description: 'eSIM ID' })
  @ApiResponse({ status: 201 })
  async topupEsim(
    @Param('id', ParseIntPipe) esimId: number,
    @Body() dto: EsimTopupDto,
    @Req() req: Request,
  ): Promise<any> {
    const userId = (req.user as any).userId;
    return this.esimTopupOrchestrator.topupEsim(esimId, dto, userId);
  }

  @Get(':id/topup-offers')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get available top-up offers for an eSIM country' })
  @ApiParam({ name: 'id', description: 'eSIM ID' })
  async getTopupOffers(
    @Param('id', ParseIntPipe) esimId: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    return this.esimTopupOrchestrator.getTopupOffers(esimId, userId);
  }
}
