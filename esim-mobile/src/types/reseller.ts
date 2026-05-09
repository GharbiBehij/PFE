export type RecentSaleStatus = 'completed' | 'pending';

export type DashboardStats = {
  todaySales: number;
  walletBalance: number;
  thisWeek: number;
  monthSales: number;
  totalCustomers: number;
  todaySalesChange?: string;
  thisWeekChange?: string;
  totalCustomersChange?: string;
  todayCommission: number;
  weekCommission: number;
  monthCommission: number;
};

export type RecentSale = {
  id: string;
  customer: string;
  package: string;
  amount: number;
  commission: number;
  status: RecentSaleStatus;
  timeAgo: string;
};

export type PendingActivation = {
  id: string;
  customer: string;
  phone: string;
  country: string;
  package: string;
  amount: number;
  purchaseDate: string;
};
