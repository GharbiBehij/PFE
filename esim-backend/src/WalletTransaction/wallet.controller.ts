import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { WalletService } from './wallet.service';
import { ApproveRejectTopUpDto, RequestTopUpDto } from './dto/topup.dto';
import { JwtAuthGuard } from '../auth/Guards/JwtAuthGuard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { Roles } from '../auth/Decoraters/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PendingTopUpHistoryResponseDto,
  TopUpHistoryResponseDto,
  TopUpRequestResponseDto,
  WalletBalanceResponseDto,
  WalletHistoryResponseDto,
} from './dto/wallet-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { TopUpService } from '../top-up/top-up.service';

interface AuthRequest {
  user: { userId: number };
}

@ApiTags('wallet')
@ApiBearerAuth('access-token')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly topUpService: TopUpService,
  ) {}

  @Get('balance')
  @Roles(Role.SALESMAN, Role.CLIENT)
  @ApiOperation({ summary: 'Get authenticated salesman wallet balance' })
  @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
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
  async getBalance(@Request() req: AuthRequest) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Get('history')
  @Roles(Role.SALESMAN, Role.CLIENT)
  @ApiOperation({ summary: 'Get authenticated salesman wallet history' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: WalletHistoryResponseDto })
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
  async getWalletHistory(
    @Request() req: AuthRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.walletService.getWalletHistory(req.user.userId, page, limit);
  }

  @Post('topup/request')
  @Roles(Role.SALESMAN, Role.CLIENT)
  @ApiOperation({
    summary: 'Submit a top-up request for authenticated salesman',
  })
  @ApiResponse({ status: 201, type: TopUpRequestResponseDto })
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
  async requestTopUp(
    @Request() req: AuthRequest,
    @Body() dto: RequestTopUpDto,
  ) {
    return this.topUpService.initiateTopUp(
      { amount: dto.amount, paymentMethod: 'CASH' },
      req.user.userId,
    );
  }

  @Get('topup/history')
  @Roles(Role.SALESMAN, Role.CLIENT)
  @ApiOperation({
    summary: 'Get authenticated salesman top-up request history',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: TopUpHistoryResponseDto })
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
  async getMyTopUpHistory(
    @Request() req: AuthRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.walletService.getSalesmanTopUpHistory(
      req.user.userId,
      page,
      limit,
    );
  }

  @Get('topup/pending')
  @Roles(Role.ADMIN, Role.ZONE_CHIEF)
  @ApiOperation({ summary: 'Get pending top-up requests ' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, type: PendingTopUpHistoryResponseDto })
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
  async getPendingTopUps(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.walletService.getPendingTopUps(page, limit);
  }

  @Post('topup/approve')
  @HttpCode(200)
  @Roles(Role.ZONE_CHIEF, Role.ADMIN)
  @ApiOperation({ summary: 'Approve a pending top-up request' })
  @ApiResponse({ status: 200, type: TopUpRequestResponseDto })
  async approveTopUp(
    @Request() req: AuthRequest,
    @Body() dto: ApproveRejectTopUpDto,
  ) {
    return this.walletService.approveTopUp(dto.topUpId, req.user.userId);
  }

  @Post('topup/reject')
  @HttpCode(200)
  @Roles(Role.ZONE_CHIEF, Role.ADMIN)
  @ApiOperation({ summary: 'Reject a pending top-up request' })
  @ApiResponse({ status: 200, type: TopUpRequestResponseDto })
  async rejectTopUp(
    @Request() req: AuthRequest,
    @Body() dto: ApproveRejectTopUpDto,
  ) {
    return this.walletService.rejectTopUp(dto.topUpId, req.user.userId);
  }
}
