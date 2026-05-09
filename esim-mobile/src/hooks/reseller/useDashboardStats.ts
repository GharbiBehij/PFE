import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../../api/wallet.api';
import type { DashboardStats } from '../../types/reseller';
import { fetchResellerTransactions } from './useTransactions';

const COMMISSION_RATE = 0.15;

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDelta = (current: number, previous: number) => {
  const delta = current - previous;
  return delta >= 0 ? `+${delta}` : String(delta);
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['reseller', 'dashboardStats'],
    queryFn: async () => {
      const [transactions, walletBalance] = await Promise.all([
        fetchResellerTransactions(),
        walletApi.getBalance(),
      ]);

      const now = new Date();
      const todayStart = startOfDay(now);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      const thisWeekStart = new Date(todayStart);
      thisWeekStart.setDate(thisWeekStart.getDate() - 6);
      const previousWeekStart = new Date(thisWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const completedTransactions = transactions.filter((transaction) => transaction.status === 'completed');

      const todaySales = completedTransactions.filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return date >= todayStart;
      }).length;

      const yesterdaySales = completedTransactions.filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return date >= yesterdayStart && date < todayStart;
      }).length;

      const thisWeekSales = completedTransactions.filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return date >= thisWeekStart;
      }).length;

      const previousWeekSales = completedTransactions.filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return date >= previousWeekStart && date < thisWeekStart;
      }).length;

      const thisMonthCustomers = new Set(
        transactions
          .filter((transaction) => new Date(transaction.createdAt) >= thisMonthStart)
          .map((transaction) => transaction.customer),
      ).size;

      const previousMonthCustomers = new Set(
        transactions
          .filter((transaction) => {
            const date = new Date(transaction.createdAt);
            return date >= previousMonthStart && date < thisMonthStart;
          })
          .map((transaction) => transaction.customer),
      ).size;

      const thisMonthSales = completedTransactions.filter((transaction) => {
        const date = new Date(transaction.createdAt);
        return date >= thisMonthStart;
      }).length;

      const totalCustomers = new Set(transactions.map((transaction) => transaction.customer)).size;

      const todayCommission = completedTransactions
        .filter((t) => new Date(t.createdAt) >= todayStart)
        .reduce((sum, t) => sum + t.amount * COMMISSION_RATE, 0);

      const weekCommission = completedTransactions
        .filter((t) => new Date(t.createdAt) >= thisWeekStart)
        .reduce((sum, t) => sum + t.amount * COMMISSION_RATE, 0);

      const monthCommission = completedTransactions
        .filter((t) => new Date(t.createdAt) >= thisMonthStart)
        .reduce((sum, t) => sum + t.amount * COMMISSION_RATE, 0);

      return {
        todaySales,
        walletBalance: walletBalance.balance,
        thisWeek: thisWeekSales,
        monthSales: thisMonthSales,
        totalCustomers,
        todaySalesChange: formatDelta(todaySales, yesterdaySales),
        thisWeekChange: formatDelta(thisWeekSales, previousWeekSales),
        totalCustomersChange: formatDelta(thisMonthCustomers, previousMonthCustomers),
        todayCommission,
        weekCommission,
        monthCommission,
      } satisfies DashboardStats;
    },
  });
};
