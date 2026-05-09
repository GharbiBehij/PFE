import { ConflictException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import { userService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResellerDto } from './dto/create-reseller.dto';

@Injectable()
export class ZoneChiefService {
  constructor(
    private readonly userService: userService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async createReseller(dto: CreateResellerDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already used');
    }

    const rawPassword = crypto.randomBytes(16).toString('base64url');
    const securePassword = `${rawPassword}A1!`;
    const hashedPassword = await bcrypt.hash(securePassword, 10);

    const newReseller = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstname: dto.firstname,
        lastname: dto.lastname,
        phone: dto.phone,
        hashedPassword,
        role: Role.SALESMAN,
        status: UserStatus.OFFLINE,
      },
    });

    await this.mailService.sendResellerCredentials({
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      password: securePassword,
    });

    return {
      id: newReseller.id,
      email: newReseller.email,
      firstname: newReseller.firstname,
      lastname: newReseller.lastname,
      phone: newReseller.phone ?? dto.phone,
      zone: dto.zone,
      role: newReseller.role,
      message:
        'Reseller account created successfully. Credentials sent via email.',
    };
  }
}
