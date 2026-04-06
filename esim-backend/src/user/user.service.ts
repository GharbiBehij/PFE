import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { userRepository } from './user.repository';
import { CreateUserDto } from './dto/Create.User.dto';
import * as bcrypt from 'bcrypt';
import { TransactionChannel, UserStatus, TransactionStatus } from '@prisma/client';
import { EsimPurchaseOrchestrator } from '../Orchestrators/EsimPurchaseOrchestrator';
import { SellEsimDto } from './dto/Sell.Esim.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class userService {
  constructor(
    private readonly userRepository: userRepository,
    @Inject(forwardRef(() => EsimPurchaseOrchestrator))
    private readonly EsimPurchaseOrchestrator: EsimPurchaseOrchestrator,
  ) { }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: number) {
    return this.userRepository.findById(id);
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.userRepository.createUser({
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      passportId: dto.passportId,
      hashedPassword,
      hashedRefreshToken: null,
    });
  }

  async validateRefreshToken(id: number, refreshToken: string) {
    const user = await this.userRepository.findById(id);
    if (!user || !user.hashedRefreshToken) return false;
    return bcrypt.compare(refreshToken, user.hashedRefreshToken);
  }

  async removeRefreshToken(id: number) {
    return this.userRepository.removeRefreshToken(id);
  }

  async updateStatus(userId: number, status: UserStatus) {
    return this.userRepository.updateStatus(userId, status);
  }

  async StoreHashedRefreshToken(userId: number, refreshToken: string) {
    return this.userRepository.StoreHashedRefreshToken(userId, refreshToken);
  }

  async sellEsim(dto: SellEsimDto, salesmanId: number) {
    return this.EsimPurchaseOrchestrator.purchaseEsim(
      {
        ...dto,
        channel: TransactionChannel.B2B2C,
        userId: salesmanId,
        offerId: dto.offerId,
        amount: dto.amount,
        currency: dto.currency,
        status: TransactionStatus.PENDING,
      },
      salesmanId,
    );
  }
}
