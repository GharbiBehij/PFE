import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { UserModule } from '../user/user.module';
import { ZoneChiefController } from './zone-chief.controller';
import { ZoneChiefService } from './zone-chief.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [UserModule, AuthModule, MailModule],
  controllers: [ZoneChiefController],
  providers: [ZoneChiefService, PrismaService],
  exports: [ZoneChiefService],
})
export class ZoneChiefModule {}
