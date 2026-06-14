import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

type ActivatedPayload = {
  iccid: string;
  qrCode: string | null;
  activationCode: string;
};

@WebSocketGateway({ namespace: '/esim', cors: { origin: '*' } })
export class EsimGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EsimGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret,
      });
      await client.join(`user-${payload.sub}`);
      this.logger.log(`Connected userId=${payload.sub} sid=${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Disconnected sid=${client.id}`);
  }

  emitActivated(userId: number, payload: ActivatedPayload): void {
    this.server.to(`user-${userId}`).emit('esim:activated', payload);
  }

  emitFailed(userId: number, transactionId: number): void {
    this.server.to(`user-${userId}`).emit('esim:failed', { transactionId });
  }

  emitTopupSuccess(
    userId: number,
    payload: { esimId: number; dataAdded: number },
  ): void {
    this.server.to(`user-${userId}`).emit('esim:topup-success', payload);
  }

  emitUsageUpdated(userId: number, esim: unknown): void {
    this.server.to(`user-${userId}`).emit('esim:usage-updated', { esim });
  }
}
