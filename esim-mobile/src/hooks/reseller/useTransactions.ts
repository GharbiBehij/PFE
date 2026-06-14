import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export type ResellerTransactionStatus = 'completed' | 'pending' | 'failed';
export type ResellerPaymentMethod = 'wallet' | 'cash';

export type ResellerTransaction = {
  id: string;
  customer: string;
  package: string;
  country: string;
  amount: number;
  commission: number;
  status: ResellerTransactionStatus;
  date: string;
  time: string;
  createdAt: string;
  paymentMethod: ResellerPaymentMethod;
};

type BackendTransaction = {
  id: number;
  status: string;
  channel: 'B2C' | 'B2B2C';
  amount: number;
  offerId: number;
  createdAt: string;
};

type BackendTransactionResponse = {
  transactions: BackendTransaction[];
};

type BackendOffer = {
  id: number;
  country: string;
  dataVolume: number;
  validityDays: number;
  InternalMargin?: number;
};

const MINOR_UNIT_FACTOR = 1000;

const toMajorUnits = (value: number) => value / MINOR_UNIT_FACTOR;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimeKey = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const toDataVolumeLabel = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 'N/A';
  }

  if (value >= 1024) {
    const gbValue = value / 1024;
    const rounded = Number.isInteger(gbValue) ? String(gbValue) : gbValue.toFixed(1);
    return `${rounded}GB`;
  }

  return `${Math.round(value)}MB`;
};

const toStatus = (status: string): ResellerTransactionStatus => {
  if (status === 'SUCCEEDED' || status === 'COMPLETED') {
    return 'completed';
  }

  if (status === 'FAILED' || status === 'EXPIRED' || status === 'REFUNDED') {
    return 'failed';
  }

  return 'pending';
};

const toPaymentMethod = (channel: BackendTransaction['channel']): ResellerPaymentMethod => {
  return channel === 'B2B2C' ? 'wallet' : 'cash';
};

const buildPackageLabel = (offer?: BackendOffer) => {
  if (!offer) {
    return 'Forfait indisponible';
  }

  const dataVolumeLabel = toDataVolumeLabel(offer.dataVolume);
  return `${offer.country} ${dataVolumeLabel} / ${offer.validityDays} jours`;
};

export const fetchResellerTransactions = async (): Promise<ResellerTransaction[]> => {
  const [transactionsResponse, offersResponse] = await Promise.all([
    apiClient.get<BackendTransactionResponse>('/transaction'),
    apiClient.get<BackendOffer[]>('/offers'),
  ]);

  const transactions = Array.isArray(transactionsResponse.data?.transactions)
    ? transactionsResponse.data.transactions
    : [];

  const offers = Array.isArray(offersResponse.data) ? offersResponse.data : [];
  const offersById = new Map<number, BackendOffer>();
  offers.forEach((offer) => {
    offersById.set(offer.id, offer);
  });

  return transactions.map((transaction) => {
    const offer = offersById.get(transaction.offerId);
    const createdAt = new Date(transaction.createdAt);

    return {
      id: String(transaction.id),
      customer: `Client #${transaction.id}`,
      package: buildPackageLabel(offer),
      country: offer?.country ?? '-',
      amount: toMajorUnits(transaction.amount),
      commission: toMajorUnits(transaction.amount) * (offer?.InternalMargin ?? 15) / 100,
      status: toStatus(transaction.status),
      date: toDateKey(createdAt),
      time: toTimeKey(createdAt),
      createdAt: transaction.createdAt,
      paymentMethod: toPaymentMethod(transaction.channel),
    };
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['reseller', 'transactions'],
    queryFn: fetchResellerTransactions,
  });
};
