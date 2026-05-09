declare module '@stripe/stripe-react-native/lib/commonjs/components/StripeProvider' {
  import * as React from 'react';
  import type { StripeProviderProps } from '@stripe/stripe-react-native';

  export const StripeProvider: React.ComponentType<StripeProviderProps>;
  export const initStripe: (params: unknown) => Promise<void>;
}

declare module '@stripe/stripe-react-native/lib/commonjs/hooks/useStripe' {
  export { useStripe } from '@stripe/stripe-react-native';
}

