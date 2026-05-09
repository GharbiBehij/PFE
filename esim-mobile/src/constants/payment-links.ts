// IMPORTANT: these values must match exactly what the backend sends to cliq to pay 
// Backend source of truth: src/payment/constants/payment-links.ts
export const PAYMENT_DEEP_LINKS = {
  success: 'netyfly://payment/success',
  fail: 'netyfly://payment/fail',
} as const;
