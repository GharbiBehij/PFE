import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ClicToPayRegisterParams {
  orderNumber: string;
  amount: number;
  currency?: number;
  returnUrl: string;
  failUrl?: string;
  language?: string;
  pageView?: string;
  description?: string;
  email?: string;
  sessionTimeoutSecs?: number;
}

export interface ClicToPayRegisterResponse {
  orderId?: string;
  formUrl?: string;
  errorCode?: number;
  errorMessage?: string;
}

export interface ClicToPayOrderStatus {
  OrderStatus: number;
  ErrorCode: string;
  ErrorMessage: string;
  OrderNumber: string;
  Pan?: string;
  Amount: number;
  currency?: string;
  approvalCode?: string;
  cardholderName?: string;
  ip?: string;
  expiration?: string;
}

export interface ClicToPayExtendedStatus extends ClicToPayOrderStatus {
  orderStatus: number;
  actionCode: number;
  actionCodeDescription: string;
  date: number;
  orderDescription?: string;
  cardAuthInfo?: {
    pan?: string;
    expiration?: string;
    cardholderName?: string;
    approvalCode?: string;
    secureAuthInfo?: {
      eci?: number;
      threeDSInfo?: {
        cavv?: string;
        xid?: string;
      };
    };
  };
}

export interface ClicToPayErrorResponse {
  errorCode: number | string;
  errorMessage: string;
}

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
  this.defaultReturnUrl = this.config.get<string>('CLICTOPAY_SUCCESS_URL', ''); // ← add
  this.defaultFailUrl = this.config.get<string>('CLICTOPAY_FAIL_URL', '');
}

  async registerOrder(params: ClicToPayRegisterParams): Promise<ClicToPayRegisterResponse> {
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
    if (params.email) {
      body.append('jsonParams', JSON.stringify({ email: params.email }));
    }

    const url = `${this.baseUrl}/payment/rest/register.do`;
    this.logger.log(`Registering order: ${params.orderNumber}, amount: ${params.amount} millimes`);
    this.logger.log(`[DEBUG] returnUrl = "${params.returnUrl || this.defaultReturnUrl}"`);
    this.logger.log(`[DEBUG] defaultReturnUrl = "${this.defaultReturnUrl}"`);
    this.logger.log(`[DEBUG] CLICTOPAY_SUCCESS_URL env = "${this.config.get('CLICTOPAY_SUCCESS_URL')}"`);
    const response = await axios.post<ClicToPayRegisterResponse>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      httpsAgent: this.httpsAgent,
    });

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

  async getOrderStatus(orderId: string, language = 'fr'): Promise<ClicToPayOrderStatus> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/payment/rest/getOrderStatus.do`;
    const response = await axios.post<ClicToPayOrderStatus>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      httpsAgent: this.httpsAgent,
    });

    return response.data;
  }

  async getOrderStatusExtended(orderId: string, language = 'fr'): Promise<ClicToPayExtendedStatus> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/payment/rest/getOrderStatusExtended.do`;
    const response = await axios.post<ClicToPayExtendedStatus>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      httpsAgent: this.httpsAgent,
    });

    return response.data;
  }

  async reverseOrder(orderId: string, language = 'fr'): Promise<ClicToPayErrorResponse> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('language', language);

    const url = `${this.baseUrl}/payment/rest/reverse.do`;
    this.logger.log(`Reversing order: ${orderId}`);

    const response = await axios.post<ClicToPayErrorResponse>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      httpsAgent: this.httpsAgent,

    });

    return response.data;
  }

  async refundOrder(orderId: string, amount: number): Promise<ClicToPayErrorResponse> {
    const body = new URLSearchParams();
    body.append('userName', this.userName);
    body.append('password', this.password);
    body.append('orderId', orderId);
    body.append('amount', String(amount));

    const url = `${this.baseUrl}/payment/rest/refund.do`;
    this.logger.log(`Refunding order: ${orderId}, amount: ${amount} millimes`);

    const response = await axios.post<ClicToPayErrorResponse>(url, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      httpsAgent: this.httpsAgent,

    });

    return response.data;
  }
}
