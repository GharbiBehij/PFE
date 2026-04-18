import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PurchaseResult } from '../types/payment';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  Destinations: undefined;
  PackageListing: {
    countryId: string;
    heroCountry?: string;
    heroImageUrl?: string;
  };
  PackageDetail: {
    packageId: string;
  };
  Payment: {
    packageId: string;
  };
  Success: {
    result: PurchaseResult;
  };
};

export type EsimsStackParamList = {
  MyEsims: undefined;
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
