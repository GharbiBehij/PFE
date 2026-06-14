import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as https from 'https';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  PaymentStatusResult,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class ClicToPayGateway implements PaymentGatewayAdapter {
  private readonly logger = new Logger(ClicToPayGateway.name);
  private readonly baseUrl: string;
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.config.get<string>('CLICTOPAY_BASE_URL') ?? 'https://test.clictopay.com/payment/rest';
  }

  private get credentials() {
    return {
      userName: this.config.get<string>('CLICTOPAY_USERNAME'),
      password: this.config.get<string>('CLICTOPAY_PASSWORD'),
    };
  }

  private get appUrl(): string {
    return this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  private toHttpUrl(
    value: string | undefined,
    fallbackPath: string,
    key: string,
  ): string {
    const fallbackUrl = `${this.appUrl.replace(/\/+$/, '')}${fallbackPath}`;

    if (!value) return fallbackUrl;

    try {
      const parsed = new URL(value);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return value;
      }
    } catch {
      // fall through to fallback
    }

    this.logger.warn(
      `${key} must be an http(s) URL. Falling back to: ${fallbackUrl}`,
    );
    return fallbackUrl;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const url = `${this.baseUrl}/payment/rest/register.do`;
    const returnUrl = this.toHttpUrl(
      this.config.get<string>('CLICTOPAY_SUCCESS_URL'),
      '/payment/success',
      'CLICTOPAY_SUCCESS_URL',
    );
    const failUrl = this.toHttpUrl(
      this.config.get<string>('CLICTOPAY_FAIL_URL'),
      '/payment/fail',
      'CLICTOPAY_FAIL_URL',
    );
    const params = {
      userName: this.credentials.userName,
      password: this.credentials.password,
      orderNumber: String(input.transactionId),
      amount: Math.round(input.amount),
      currency: 788,
      returnUrl,
      failUrl,
      description: `NetyFly eSIM - Transaction ${input.transactionId}`,
      language: 'fr',
    };
    const headers = {
      Accept: 'application/json',
    };

    console.log('PAYMENT REQUEST DEBUG', {
      url,
      method: 'POST',
      headers,
      data: null,
      params: {
        ...params,
        password: params.password ? '***' : params.password,
      },
    });

    const { data } = await this.httpService.axiosRef.post(url, null, {
      params,
      headers,
      httpsAgent: this.httpsAgent,
    });

    if (data.errorCode && data.errorCode !== '0') {
      this.logger.error(
        `ClicToPay register.do error ${data.errorCode}: ${data.errorMessage}`,
      );
      throw new Error(`ClicToPay error: ${data.errorMessage}`);
    }

    return {
      gatewayPaymentId: data.orderId,
      paymentUrl: data.formUrl,
      type: 'REDIRECT',
    };
  }

  async fetchPaymentStatus(
    gatewayPaymentId: string,
  ): Promise<PaymentStatusResult> {
    if (gatewayPaymentId.startsWith('mock-')) {
      return { status: 'SUCCESS' };
    }

    const { data } = await this.httpService.axiosRef.post(
      `${this.baseUrl}/payment/rest/getOrderStatus.do`,
      null,
      {
        params: {
          userName: this.credentials.userName,
          password: this.credentials.password,
          orderId: gatewayPaymentId,
          language: 'fr',
        },
        httpsAgent: this.httpsAgent,
      },
    );

    // ClicToPay returns OrderStatus (capital O) per ClicToPayOrderStatus interface.
    // data.orderStatus (lowercase) would always be undefined → always 'PENDING'.
    const orderStatus: number = data.OrderStatus ?? data.orderStatus;
    switch (orderStatus) {
      case 2:
        return { status: 'SUCCESS' };
      case 1:
        return { status: 'PENDING' };
      case 0:
      case 5:
        return { status: 'PENDING' };
      case 3:
      case 6:
      case 4:
        return { status: 'FAILED' };
      default:
        return { status: 'PENDING' };
    }
  }
}
