import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { refreshDto } from './dto/refresh.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './Guards/JwtAuthGuard';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
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
  async getMe(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req.user as any).userId;
    res.clearCookie('refresh_token');
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const dto: refreshDto = {
      id: (req.user as any).userId,
      refreshToken: req.cookies['refresh_token'],
    };
    const result = await this.authService.refresh(dto);
    res.cookie('refresh_token', result.refresh_token, COOKIE_OPTIONS);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    };
  }
}
