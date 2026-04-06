import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
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
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.OFFLINE) {
      await this.userService.updateStatus(user.id, UserStatus.ONLINE);
    }

    return this.generateAndSaveTokens(user);
  }

  async signup(dto: SignupDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already used');

    const newUser = await this.userService.create({ ...dto });
    return this.generateAndSaveTokens(newUser);
  }

  async logout(id: number) {
    const user = await this.userService.findById(id);
    if (!user) throw new UnauthorizedException('User not found');

    if (user.status === UserStatus.ONLINE) {
      await this.userService.removeRefreshToken(id);
      await this.userService.updateStatus(id, UserStatus.OFFLINE);
    }
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.toPublicUser(user);
  }

  async refresh(dto: refreshDto) {
    const isValid = await this.userService.validateRefreshToken(dto.id, dto.refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userService.findById(dto.id);
    return this.generateAndSaveTokens(user);
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
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      balance: user.balance,
    };
  }
}
