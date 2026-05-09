import { Injectable } from '@nestjs/common';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  PaymentStatusResult,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const gatewayPaymentId = 'mock_pay_' + Math.random().toString(36).substring(2, 12);
    const paymentUrl = `https://mock-gateway.test/pay/${gatewayPaymentId}?amount=${input.amount}&currency=${input.currency}`;
    return { gatewayPaymentId, paymentUrl, type: 'REDIRECT' };
  }

  async fetchPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResult> {
    // Mock: 70% SUCCESS, 20% PENDING, 10% FAILED
    const rand = Math.random();
    if (rand < 0.7) return { status: 'SUCCESS' };
    if (rand < 0.9) return { status: 'PENDING' };
    return { status: 'FAILED' };
  }
}
