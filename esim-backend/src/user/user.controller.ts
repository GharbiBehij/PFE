import { Controller, Get, Post, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { userService } from './user.service';
import { CreateUserDto } from './dto/Create.User.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SellEsimDto } from './dto/Sell.Esim.dto';
import { JwtAuthGuard } from '../auth/Guards/JwtAuthGuard';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PurchaseResponseDto } from '../transaction/dto/transaction-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';

@ApiTags('user')
@Controller('user')
export class userController {
  constructor(private readonly userService: userService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Sell eSIM for customer (hidden due duplicate route)' })
  @ApiResponse({ status: 201, type: PurchaseResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  async Sell(@Body() dto: SellEsimDto, userId: number) {
    return this.userService.sellEsim(dto, userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  getProfile(@Req() req: Request) {
    return this.userService.getProfile((req.user as any).userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Email already taken', type: ErrorResponseDto })
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    return this.userService.updateProfile((req.user as any).userId, dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 201, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect', type: ErrorResponseDto })
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    return this.userService.changePassword((req.user as any).userId, dto);
  }
}
