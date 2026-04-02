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

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    // ── SALESMAN ROUTES ────────────────────────────────────────────────────────

    @Get('balance')
    @Roles(Role.SALESMAN)
    async getBalance(@Request() req) {
        return this.walletService.getBalance(req.user.id);
    }

    @Get('history')
    @Roles(Role.SALESMAN)
    async getWalletHistory(
        @Request() req,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getWalletHistory(req.user.id, page, limit);
    }

    @Post('topup/request')
    @Roles(Role.SALESMAN)
    async requestTopUp(@Request() req, @Body() dto: RequestTopUpDto) {
        return this.walletService.requestTopUp(req.user.id, dto.amount);
    }

    @Get('topup/history')
    @Roles(Role.SALESMAN)
    async getMyTopUpHistory(
        @Request() req,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getSalesmanTopUpHistory(req.user.id, page, limit);
    }

    // ── ADMIN ROUTES (CLIENT role) ─────────────────────────────────────────────

    @Get('topup/pending')
    @Roles(Role.CLIENT)
    async getPendingTopUps(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.walletService.getPendingTopUps(page, limit);
    }

    @Post('topup/approve')
    @HttpCode(200)
    @Roles(Role.CLIENT)
    async approveTopUp(@Request() req, @Body() dto: ApproveRejectTopUpDto) {
        return this.walletService.approveTopUp(dto.topUpId, req.user.id);
    }

    @Post('topup/reject')
    @HttpCode(200)
    @Roles(Role.CLIENT)
    async rejectTopUp(@Request() req, @Body() dto: ApproveRejectTopUpDto) {
        return this.walletService.rejectTopUp(dto.topUpId, req.user.id);
    }
}
