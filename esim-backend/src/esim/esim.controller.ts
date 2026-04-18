import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
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
import {
  EsimListResponseDto,
  EsimMessageResponseDto,
  EsimResponseDto,
} from './dto/esim-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';

@ApiTags('esims')
@ApiBearerAuth('access-token')
@Controller(['esims', 'esim'])
export class EsimController {
  constructor(private readonly esimService: EsimService) {}

  @Get('destinations')
  @ApiOperation({ summary: 'Get available destinations aggregated from offers' })
  @ApiResponse({ status: 200, type: [DestinationResponseDto] })
  getDestinations() {
    return this.esimService.getDestinations();
  }

  @Get('my-esims')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user eSIMs grouped by status (legacy path)' })
  @ApiResponse({ status: 200, type: EsimListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  getMyEsimsLegacy(@Req() req: Request) {
    return this.esimService.getUserEsims((req.user as any).userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user eSIMs grouped by status' })
  @ApiResponse({ status: 200, type: EsimListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  getUserEsims(@Req() req: Request) {
    return this.esimService.getUserEsims((req.user as any).userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an eSIM by id for authenticated user' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 200, type: EsimResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'eSIM not found', type: ErrorResponseDto })
  getEsimById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.esimService.getEsimById((req.user as any).userId, id);
  }

  @Post(':id/sync-usage')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync eSIM usage data from provider' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 201, type: EsimResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'eSIM not found', type: ErrorResponseDto })
  syncUsage(@Param('id', ParseIntPipe) id: number) {
    return this.esimService.syncUsage(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft-delete an eSIM owned by authenticated user' })
  @ApiParam({ name: 'id', type: Number, example: 77 })
  @ApiResponse({ status: 200, type: EsimMessageResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot delete active eSIM with remaining data', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'eSIM not found', type: ErrorResponseDto })
  deleteEsim(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.esimService.deleteEsim((req.user as any).userId, id);
  }
}
