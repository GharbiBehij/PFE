import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './Guards/JwtAuthGuard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthResponseDto,
  AuthUserResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import { ErrorResponseDto } from '../Common/dto/error-response.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials', type: ErrorResponseDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    res.cookie('refresh_token', result.refresh_token, COOKIE_OPTIONS);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User created', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already used', type: ErrorResponseDto })
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(dto);
    res.cookie('refresh_token', result.refresh_token, COOKIE_OPTIONS);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get currently authenticated user' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: AuthUserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async getMe(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear refresh token cookie' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 201, type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req.user as any).userId;
    res.clearCookie('refresh_token');
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token (body or cookie)' })
  @ApiCookieAuth('refresh-token')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token', type: ErrorResponseDto })
  async refresh(
    @Req() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = body?.refreshToken ?? req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refreshByToken(refreshToken);
    res.cookie('refresh_token', result.refresh_token, COOKIE_OPTIONS);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    };
  }
}
