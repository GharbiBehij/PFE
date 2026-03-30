import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { userService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { refreshDto } from './dto/refresh.dto';
import { UserStatus } from '@prisma/client';


@Injectable()
export class AuthService {
  constructor(
    private userService: userService,
    private jwtService: JwtService,
  ) { }

  async login(dto: LoginDto) {
    const user = await this.userService.findById(dto.id);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.Password, user.hashedPassword);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === UserStatus.OFFLINE) {
      await this.userService.updateStatus(dto.id, UserStatus.ONLINE)
    }

    return this.generateAndSaveTokens(user);
  }

  async logout(id: number) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.status === UserStatus.ONLINE) {
      await this.userService.removeRefreshToken(id);
      await this.userService.updateStatus(id, UserStatus.OFFLINE)
    }
    return { message: 'Logged out successfully' };
  }
  async signup(dto: SignupDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already used');
    }
    const newUser = await this.userService.create({
      ...dto,
    });
    return this.generateAndSaveTokens(newUser);
  }
  async validateRefreshToken(id: number, refreshToken: string) {
    const user = await this.userService.findById(id);
    if (!user || !user.hashedRefreshToken) return false;

    return bcrypt.compare(refreshToken, user.hashedRefreshToken);
  }

  async refresh(dto: refreshDto) {
    const isValid = await this.validateRefreshToken(dto.id, dto.refreshToken);
    if (!isValid)
      throw new UnauthorizedException('Invalid refresh token');
    const user = await this.userService.findById(dto.id)

    return this.generateAndSaveTokens(user)
  }

  async generateAndSaveTokens(user: any) {

    const payload = { sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.userService.StoreHashedRefreshToken(user.id, hashedRefreshToken);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

}
