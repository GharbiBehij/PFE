import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { EsimService } from './esim.service';
import { JwtAuthGuard } from '../auth/Guards/JwtAuthGuard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  EsimListResponseDto,
  EsimMessageResponseDto,
  EsimResponseDto,
} from './dto/esim-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { EsimTopupDto } from './dto/esim-topup.dto';
import { IdempotencyGuard } from '../Common/guards/idempotency.guard';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';
import { EsimActivationOrchestrator } from '../Orchestrators/EsimActivateOrchestrator';
import { ActivateEsimRequestDto } from './dto/activate-esim.dto';
import { SellEsimDto } from '../user/dto/Sell.Esim.dto';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decoraters/roles.decorator';
import { userService } from '../user/user.service';

@ApiTags('esims')
@ApiBearerAuth('access-token')
@Controller(['esims', 'esim'])
export class EsimController {
  constructor(
    private readonly esimService: EsimService,
    private readonly topUpOrchestrator: TopUpOrchestrator,
    private readonly activationOrchestrator: EsimActivationOrchestrator,
    private readonly userService: userService,
  ) {}
  @Get('destinations')
  @ApiOperation({
    summary: 'Get available destinations aggregated from offers',
  })
  @ApiResponse({ status: 200, type: [DestinationResponseDto] })
  getDestinations() {
    return this.esimService.getDestinations();
  }
  @Get('my-esims')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get authenticated user eSIMs grouped by status (legacy path)',
  })
  @ApiResponse({ status: 200, type: EsimListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  getMyEsimsLegacy(@Req() req: Request) {
    return this.esimService.getUserEsims((req.user as any).userId);
  }
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user eSIMs grouped by status' })
  @ApiResponse({ status: 200, type: EsimListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  getUserEsims(@Req() req: Request) {
    return this.esimService.getUserEsims((req.user as any).userId);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an eSIM by id for authenticated user' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 200, type: EsimResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'eSIM not found',
    type: ErrorResponseDto,
  })
  getEsimById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.esimService.getEsimById((req.user as any).userId, id);
  }
  @Post(':id/sync-usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync eSIM usage data from provider' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 201, type: EsimResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'eSIM not found',
    type: ErrorResponseDto,
  })
  syncUsage(@Param('id', ParseIntPipe) id: number) {
    return this.esimService.syncUsage(id);
  }

  @Post(':id/topup')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @ApiOperation({ summary: 'Initiate B2C top-up for an active eSIM' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 201, description: 'Top-up initiated' })
  @ApiResponse({
    status: 400,
    description: 'Invalid top-up request',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  async initiateTopup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EsimTopupDto,
    @Req() req: Request,
  ) {
    const result = await this.topUpOrchestrator.topupEsim(
      id,
      dto,
      (req.user as any).userId,
    );
    if (result?.status === 'PENDING_PAYMENT' && 'paymentUrl' in result) {
      return {
        transactionId: result.transactionId,
        paymentUrl: result.paymentUrl,
      };
    }
    return result;
  }

  @Post('sell')
  @UseGuards(JwtAuthGuard, RolesGuard, IdempotencyGuard)
  @Roles(Role.SALESMAN)
  @ApiOperation({ summary: 'Sell eSIM for customer (B2B2C)' })
  @ApiResponse({ status: 201, description: 'Sale initiated' })
  async sellEsim(@Body() dto: SellEsimDto, @Req() req: Request) {
    const salesmanId = (req.user as any).userId;
    return this.userService.sellEsim(dto, salesmanId);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALESMAN)
  @ApiOperation({ summary: 'Request activation for an eSIM (B2B2C)' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 201, description: 'Activation requested' })
  async activateEsim(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActivateEsimRequestDto,
    @Req() req: Request,
  ) {
    return this.activationOrchestrator.activateEsim(
      { esimId: id, transactionId: dto.transactionId },
      (req.user as any).userId,
    );
  }

  @Post(':id/planifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALESMAN)
  @ApiOperation({ summary: 'Schedule activation for an eSIM (B2B2C)' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 201, description: 'Activation scheduled' })
  async scheduleActivation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActivateEsimRequestDto,
    @Req() req: Request,
  ) {
    return this.activationOrchestrator.activateEsim(
      { esimId: id, transactionId: dto.transactionId },
      (req.user as any).userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft-delete an eSIM owned by authenticated user' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 200, type: EsimMessageResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete active eSIM with remaining data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'eSIM not found',
    type: ErrorResponseDto,
  })
  deleteEsim(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.esimService.deleteEsim((req.user as any).userId, id);
  }
}
