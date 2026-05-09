import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClicToPayService } from './clictopay.service';

@Module({
  imports: [ConfigModule],
  providers: [ClicToPayService],
  exports: [ClicToPayService],
})
export class ClicToPayModule {}
