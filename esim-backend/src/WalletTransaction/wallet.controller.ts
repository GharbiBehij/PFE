import {
    Controller, Post, Body, Get, HttpCode,
    UseGuards, Request, Query, DefaultValuePipe, ParseIntPipe,
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

@ApiTags('wallet')
@ApiBearerAuth('access-token')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    // ── SALESMAN ROUTES ────────────────────────────────────────────────────────

    @Get('balance')
    @Roles(Role.SALESMAN, Role.CLIENT)
    @ApiOperation({ summary: 'Get authenticated salesman wallet balance' })
    @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    async getBalance(@Request() req) {
        return this.walletService.getBalance(req.user.id);
    }

    @Get('history')
    @Roles(Role.SALESMAN, Role.CLIENT)
    @ApiOperation({ summary: 'Get authenticated salesman wallet history' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, type: WalletHistoryResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    async getWalletHistory(
        @Request() req,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getWalletHistory(req.user.id, page, limit);
    }

    @Post('topup/request')
    @Roles(Role.SALESMAN, Role.CLIENT)
    @ApiOperation({ summary: 'Submit a top-up request for authenticated salesman' })
    @ApiResponse({ status: 201, type: TopUpRequestResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    async requestTopUp(@Request() req, @Body() dto: RequestTopUpDto) {
        return this.walletService.requestTopUp(req.user.id, dto.amount);
    }

    @Get('topup/history')
    @Roles(Role.SALESMAN, Role.CLIENT)
    @ApiOperation({ summary: 'Get authenticated salesman top-up request history' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, type: TopUpHistoryResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    async getMyTopUpHistory(
        @Request() req,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getSalesmanTopUpHistory(req.user.id, page, limit);
    }

    // ── ADMIN ROUTES ──────────────────────────────────────────────────────────

    @Get('topup/pending')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Get pending top-up requests (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, type: PendingTopUpHistoryResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    async getPendingTopUps(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getPendingTopUps(page, limit);
    }

    @Post('topup/approve')
    @HttpCode(200)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Approve a pending top-up request' })
    @ApiResponse({ status: 200, type: TopUpRequestResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    @ApiResponse({ status: 404, description: 'Top-up request not found', type: ErrorResponseDto })
    async approveTopUp(@Request() req, @Body() dto: ApproveRejectTopUpDto) {
        return this.walletService.approveTopUp(dto.topUpId, req.user.id);
    }

    @Post('topup/reject')
    @HttpCode(200)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Reject a pending top-up request' })
    @ApiResponse({ status: 200, type: TopUpRequestResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
    @ApiResponse({ status: 404, description: 'Top-up request not found', type: ErrorResponseDto })
    async rejectTopUp(@Request() req, @Body() dto: ApproveRejectTopUpDto) {
        return this.walletService.rejectTopUp(dto.topUpId, req.user.id);
    }
}
