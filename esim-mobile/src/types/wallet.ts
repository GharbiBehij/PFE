export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletLedgerEntry {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  reason: 'RESERVE' | 'COMMIT' | 'RELEASE' | 'TOP_UP' | 'REFUND';
  createdAt: string;
}

export interface TopUpRequest {
  amount: number;
}
