// ── ClicToPay (CliQ) Gateway Interfaces ──────────────────────────────────────
// Contracts for interacting with the ClicToPay payment gateway REST API.
// Used by ClicToPayService and the ClicToPayGateway adapter.

export interface ClicToPayRegisterParams {
  orderNumber: string;
  amount: number;
  currency?: number;
  returnUrl: string;
  failUrl?: string;
  /** Server-to-server callback URL (CLICTOPAY_WEBHOOK_URL). */
  notificationUrl?: string;
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
