import { Module } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { userRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [userController],
  providers: [userService, userRepository, PrismaService],
  exports: [userService],
})
export class UserModule {}
