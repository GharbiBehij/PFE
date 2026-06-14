import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EsimGateway } from './esim.gateway';

@Module({
  imports: [
    // ConfigModule is global — ConfigService is injectable without re-importing it
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EsimGateway],
  exports: [EsimGateway],
})
export class GatewayModule {}
