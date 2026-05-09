import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: { skipAnimation?: boolean } | undefined;
  Login: { source?: 'onboarding' | 'app' } | undefined;
  Register: { source?: 'onboarding' | 'app' } | undefined;
  ResellerLogin: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  Destinations: undefined;
  PackageListing: {
    countryId: string;
    coverageType?: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
    heroCountry?: string;
    heroImageUrl?: string;
  };
  PackageDetail: {
    packageId: string;
  };
  Payment: {
    packageId: string;
  };
  PaymentWebView: {
    paymentUrl: string;
    transactionId: number;
  };
  ProcessingModal: {
    transactionId: number;
    channel: 'B2C' | 'B2B2C';
  };
  EsimSuccess: {
    transactionId: number;
    channel: 'B2C' | 'B2B2C';
  };
  EsimFailed: {
    transactionId: number;
    reason?: string;
  };
  EsimExpired: {
    transactionId: number;
  };
};

export type EsimsStackParamList = {
  MyEsims: undefined;
  GuestEsims: undefined;
  EsimDetail: {
    esimId: string;
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  PersonalDetails: undefined;
  PaymentMethods: undefined;
  Settings: undefined;
  HelpCenter: undefined;
  Wallet: undefined;
  TopUp: undefined;
};

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  EsimsTab: NavigatorScreenParams<EsimsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type ResellerDashboardStackParamList = {
  Dashboard: undefined;
  ActivateESIM: {
    id: string;
    customer: string;
    phone: string;
    country: string;
    package: string;
    amount: string;
    purchaseDate: string;
  };
};

export type ResellerSellStackParamList = {
  Sell: undefined;
};

export type ResellerTransactionsStackParamList = {
  Transactions: undefined;
};

export type ResellerWalletStackParamList = {
  Wallet: { hideTabBar?: boolean } | undefined;
};

export type ResellerTabsParamList = {
  DashboardTab: NavigatorScreenParams<ResellerDashboardStackParamList>;
  SellTab: NavigatorScreenParams<ResellerSellStackParamList>;
  TransactionsTab: NavigatorScreenParams<ResellerTransactionsStackParamList>;
  WalletTab: NavigatorScreenParams<ResellerWalletStackParamList>;
  ProfileTab: undefined;
};
