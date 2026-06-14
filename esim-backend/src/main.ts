import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function bootstrap() {
  // Do NOT pass rawBody: true — we handle it manually below
  const app = await NestFactory.create(AppModule);

  // ── Webhook route — raw body BEFORE json parser ────────────────
  app.use('/payment/webhook', (req: any, res: any, next: any) => {
    express.raw({ type: 'application/json' })(req, res, (err) => {
      if (err) return next(err);
      // Manually attach to rawBody so RawBodyRequest works
      req.rawBody = req.body;
      next();
    });
  });

  // ── Global JSON parser for all other routes ────────────────────
  app.use(express.json());

  // ── Rest of middleware ─────────────────────────────────────────
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NetyFly API')
      .setDescription(
        'eSIM travel platform API - customer and reseller endpoints',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addCookieAuth(
        'refresh_token',
        { type: 'apiKey', in: 'cookie', name: 'refresh_token' },
        'refresh-token',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('offers', 'eSIM offer catalog')
      .addTag('transactions', 'Purchase and transaction history')
      .addTag('wallet', 'Wallet balance and top-up')
      .addTag('esims', 'eSIM management and usage')
      .addTag('user', 'User profile')
      .addTag('payment', 'Payment processing')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
