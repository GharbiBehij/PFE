import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ClicToPayRegisterParams,
  ClicToPayRegisterResponse,
  ClicToPayOrderStatus,
  ClicToPayExtendedStatus,
  ClicToPayErrorResponse,
} from '../interfaces/clictopay.interfaces';
import * as https from 'https';

@Injectable()
export class ClicToPayService {
  private readonly logger = new Logger(ClicToPayService.name);
  private readonly baseUrl: string;
  private readonly userName: string;
  private readonly password: string;
  private readonly defaultReturnUrl: string;
  private readonly defaultFailUrl: string;
  private readonly httpsAgent: any;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.getOrThrow<string>('CLICTOPAY_BASE_URL');
    this.userName = this.config.getOrThrow<string>('CLICTOPAY_USERNAME');
    this.password = this.config.getOrThrow<string>('CLICTOPAY_PASSWORD');
    this.defaultReturnUrl = this.config.get<string>(
      'CLICTOPAY_SUCCESS_URL',
      '',
    );
    this.defaultFailUrl = this.config.get<string>('CLICTOPAY_FAIL_URL', '');
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  async registerOrder(
    params: ClicToPayRegisterParams,
  ): Promise<ClicToPayRegisterResponse> {
    if (this.config.get('PROVIDER_TYPE') === 'mock') {
      const orderId = `mock-${Date.now()}`;
      const backendUrl = this.config.get('BACKEND_URL', 'http://localhost:3000');
      const returnUrl = params.returnUrl || this.defaultReturnUrl;
      const failUrl = params.failUrl || this.defaultFailUrl;
      return {
        orderId,
        formUrl: `${backendUrl}/payment/mock/pay?orderId=${orderId}&returnUrl=${encodeURIComponent(returnUrl)}&failUrl=${encodeURIComponent(failUrl)}`,
      } as ClicToPayRegisterResponse;
    }

    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderNumber', params.orderNumber);
    body.append('amount', String(params.amount));
    body.append('currency', String(params.currency ?? 788));
    body.append('returnUrl', params.returnUrl || this.defaultReturnUrl);
    if (params.failUrl || this.defaultFailUrl) {
      body.append('failUrl', params.failUrl || this.defaultFailUrl);
    }
    if (params.language) body.append('language', params.language);
    if (params.pageView) body.append('pageView', params.pageView);
    if (params.description) body.append('description', params.description);
    if (params.sessionTimeoutSecs) {
      body.append('sessionTimeoutSecs', String(params.sessionTimeoutSecs));
    }
    // notificationUrl is passed as a top-level param (Sberbank REST v2 format).
    if (params.notificationUrl) {
      body.append('notificationUrl', params.notificationUrl);
    }
    // jsonParams carries email pre-fill for the payment form.
    if (params.email) {
      body.append('jsonParams', JSON.stringify({ email: params.email }));
    }

    const url = `${this.baseUrl}/epg/rest/register.do`;
    this.logger.log(
      `Registering order: ${params.orderNumber}, amount: ${params.amount} millimes`,
    );
    this.logger.log(
      `[DEBUG] returnUrl = "${params.returnUrl || this.defaultReturnUrl}"`,
    );
    this.logger.log(`[DEBUG] defaultReturnUrl = "${this.defaultReturnUrl}"`);
    this.logger.log(
      `[DEBUG] CLICTOPAY_SUCCESS_URL env = "${this.config.get('CLICTOPAY_SUCCESS_URL')}"`,
    );

    const response = await axios.post<ClicToPayRegisterResponse>(
      url,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
        httpsAgent: this.httpsAgent,
      },
    );

    const data = response.data;

    if (data.errorCode && data.errorCode !== 0) {
      this.logger.warn(
        `ClicToPay register error for ${params.orderNumber}: [${data.errorCode}] ${data.errorMessage}`,
      );
    } else {
      this.logger.log(`Order registered: ${data.orderId}`);
    }

    return data;
  }

  async getOrderStatus(
    orderId: string,
    language = 'fr',
  ): Promise<ClicToPayOrderStatus> {
    if (orderId.startsWith('mock-')) {
      this.logger.log(`Mock order status: orderId=${orderId} → DEPOSITED`);
      return { OrderStatus: 2, ErrorCode: 0, Amount: 0, Currency: 788 } as unknown as ClicToPayOrderStatus;
    }

    this.logger.log(`Fetching order status: orderId=${orderId}`);
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/epg/rest/getOrderStatus.do`;
    const response = await axios.post<ClicToPayOrderStatus>(
      url,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        httpsAgent: this.httpsAgent,
      },
    );

    const data = response.data;
    this.logger.log(
      `Order status: orderId=${orderId} status=${data.OrderStatus} errorCode=${data.ErrorCode}`,
    );
    return data;
  }

  async getOrderStatusExtended(
    orderId: string,
    language = 'fr',
  ): Promise<ClicToPayExtendedStatus> {
    this.logger.log(`Fetching extended order status: orderId=${orderId}`);
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/epg/rest/getOrderStatusExtended.do`;
    this.logger.log(`Calling URL: ${url}`);
    const response = await axios.post<ClicToPayExtendedStatus>(
      url,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        httpsAgent: this.httpsAgent,
      },
    );

    const data = response.data;
    this.logger.log(
      `Extended order status: orderId=${orderId} status=${data.OrderStatus} actionCode=${data.actionCode}`,
    );
    return data;
  }

  async reverseOrder(
    orderId: string,
    language = 'fr',
  ): Promise<ClicToPayErrorResponse> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/epg/rest/reverse.do`;
    this.logger.log(`Calling URL: ${url}`);
    this.logger.log(`Reversing order: ${orderId}`);

    const response = await axios.post<ClicToPayErrorResponse>(
      url,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        httpsAgent: this.httpsAgent,
      },
    );

    const data = response.data;
    this.logger.log(
      `Reverse result: orderId=${orderId} errorCode=${data.errorCode}`,
    );
    return data;
  }

  async refundOrder(
    orderId: string,
    amount: number,
  ): Promise<ClicToPayErrorResponse> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('amount', String(amount));

    const url = `${this.baseUrl}/epg/rest/refund.do`;
    this.logger.log(`Refunding order: ${orderId}, amount: ${amount} millimes`);

    const response = await axios.post<ClicToPayErrorResponse>(
      url,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
        httpsAgent: this.httpsAgent,
      },
    );

    const data = response.data;
    this.logger.log(
      `Refund result: orderId=${orderId} errorCode=${data.errorCode}`,
    );
    return data;
  }
}
