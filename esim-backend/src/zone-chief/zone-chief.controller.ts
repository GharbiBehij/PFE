import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/Decoraters/roles.decorator';
import { JwtAuthGuard } from '../auth/Guards/JwtAuthGuard';
import { RolesGuard } from '../auth/Guards/roles.guard';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { CreateResellerResponseDto } from './dto/create-reseller-response.dto';
import { ZoneChiefService } from './zone-chief.service';

@ApiTags('zone-chief')
@Controller('zone-chief')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ZoneChiefController {
  constructor(private readonly zoneChiefService: ZoneChiefService) {}

  @Post('resellers')
  @Roles(Role.ZONE_CHIEF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new reseller account (Zone Chief only)' })
  @ApiResponse({
    status: 201,
    description: 'Reseller created successfully',
    type: CreateResellerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Zone Chief role required',
  })
  @ApiResponse({ status: 409, description: 'Email already used' })
  async createReseller(@Body() dto: CreateResellerDto) {
    return this.zoneChiefService.createReseller(dto);
  }
}
