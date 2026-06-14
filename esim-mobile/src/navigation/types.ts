import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Onboarding: { skipAnimation?: boolean } | undefined;
  Login: { source?: 'onboarding' | 'app'; returnTo?: string; packageId?: string } | undefined;
  Register: { source?: 'onboarding' | 'app'; returnTo?: string; packageId?: string } | undefined;
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
    mode?: 'purchase' | 'topup';
    esimId?: string;
    offerId?: number;
  };
  PaymentWebView: {
    paymentUrl: string;
    transactionId: number;
    mode?: 'purchase' | 'topup';
    esimId?: string;
  };
  ProcessingModal: {
    transactionId: number;
    channel: 'B2C' | 'B2B2C';
    mode?: 'purchase' | 'topup';
    esimId?: string;
  };
  PaymentSuccess: {
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
  MyEsims: { initialTab?: 'ACTIVE' | 'PENDING' | 'HISTORY' } | undefined;
  GuestEsims: undefined;
  EsimConsumption: {
    esimId: string;
  };
  EsimDetail: {
    esimId: string;
  };
  TopupPackage: {
    esimId: string;
    country: string;
    countryCode: string;
    coverageType: 'LOCAL' | 'REGIONAL';
    region?: string;
  };
  TopupSuccess: {
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

export type OffersStackParamList = {
  Destinations: undefined;
  Search: undefined;
  PackageListing: HomeStackParamList['PackageListing'];
  PackageDetail: HomeStackParamList['PackageDetail'];
  Payment: HomeStackParamList['Payment'];
  PaymentWebView: HomeStackParamList['PaymentWebView'];
  ProcessingModal: HomeStackParamList['ProcessingModal'];
  PaymentSuccess: HomeStackParamList['PaymentSuccess'];
  EsimSuccess: HomeStackParamList['EsimSuccess'];
  EsimFailed: HomeStackParamList['EsimFailed'];
  EsimExpired: HomeStackParamList['EsimExpired'];
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
  DeferredActivationSuccess: {
    transactionId: number;
    customerName: string;
    customerPhone: string;
    country: string;
    offerTitle: string;
    amount: number;
    activateNow: boolean;
    activationCode?: string;
  };
};

export type ResellerSellStackParamList = {
  Sell: undefined;
  B2BSellSuccess: {
    transactionId: number;
    customerName: string;
    customerPhone: string;
    country: string;
    offerTitle: string;
    amount: number;
    activateNow: boolean;
    activationCode?: string;
  };
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
