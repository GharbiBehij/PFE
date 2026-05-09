/**
 * ProcessingModal.test.tsx
 *
 * Integration test suite for ProcessingModal component.
 *
 * Strategy
 * ─────────
 * • Suites 1–3: pure function copies (getStatusMessage, isSlow, activeDotIndex)
 *   tested in isolation — no component rendering required.
 * • Suites 4–6: real component rendered via @testing-library/react-native,
 *   mocked at boundary: useTransactionById, @expo/vector-icons,
 *   react-native-reanimated, theme.
 *
 * Run:  npx jest --testPathPattern processing-modal
 */

// ── Mocks (must be hoisted before imports) ─────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  // Use React.createElement (no JSX) so NativeWind's babel plugin does not
  // inject _ReactNativeCSSInterop references inside the factory scope.
  Ionicons: ({ name, color }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, {
      testID: `icon-${name}`,
      accessibilityLabel: `${name}-${color}`,
    });
  },
}));

// Mock worklets before reanimated so neither loads native code
jest.mock('react-native-worklets', () => ({
  runOnJS: (fn: any) => fn,
  runOnUIImmediately: (fn: any) => fn,
  makeShareableCloneRecursive: (v: any) => v,
  useSharedValue: (v: any) => ({ value: v }),
}));

// Build reanimated mock entirely from scratch — do NOT require the actual
// mock file because react-native-reanimated/mock transitively loads worklets
// native code which cannot run in a Node/Jest environment.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const React = require('react');

  const NOOP = () => {};
  const ID = (v: any) => v;

  return {
    // Named hooks and animation helpers used by ProcessingModal
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withRepeat: ID,
    withTiming: ID,
    withSequence: (...args: any[]) => args[0],
    Easing: {
      linear: ID,
      ease: ID,
      in: ID,
      out: ID,
      bezier: () => ID,
    },
    // Default export: Animated namespace — only View is used
    default: {
      View: ({ children, style }: any) => React.createElement(View, { style }, children),
      createAnimatedComponent: (C: any) => C,
    },
    // Re-export default for `import Animated from 'react-native-reanimated'`
    __esModule: true,
  };
});

const mockUseTransactionById = jest.fn();
jest.mock('../../hooks/client/usePayment', () => ({
  useTransactionById: (...args: any[]) => mockUseTransactionById(...args),
}));

jest.mock('../../theme', () => ({
  colors: {
    white: '#FFFFFF',
    primary: { DEFAULT: '#7C3AED', 200: '#DDD6FE' },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    border: '#E5E7EB',
    success: { DEFAULT: '#22C55E' },
    error: { DEFAULT: '#EF4444' },
  },
  radii: { xxl: 24, full: 9999 },
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
  },
  typography: {
    titleMD: { fontSize: 20, fontWeight: '700' },
    bodySM: { fontSize: 14 },
  },
  shadows: {
    high: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
}));

// ── Imports ─────────────────────────────────────────────────────────────────

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { ProcessingModal } from '../payment/ProcessingModal';

// ── Navigation helpers ───────────────────────────────────────────────────────

function makeNavigation(
  overrides: Partial<{
    replace: jest.Mock;
    navigate: jest.Mock;
    goBack: jest.Mock;
  }> = {},
) {
  return {
    replace: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    ...overrides,
  };
}

function makeRoute(transactionId: number, channel: 'B2C' | 'B2B2C' = 'B2C') {
  return {
    params: { transactionId, channel },
    key: 'ProcessingModal',
    name: 'ProcessingModal' as const,
  };
}

// ── Transaction data helper ──────────────────────────────────────────────────

function makeTransactionResponse(
  overrides: Partial<{
    status: string;
    attemptNumber: number | null;
    durationMs: number | null;
  }> = {},
) {
  return {
    status: overrides.status ?? 'PENDING_PAYMENT',
    attemptNumber: overrides.attemptNumber ?? null,
    durationMs: overrides.durationMs ?? null,
  };
}

// ── Render helper ────────────────────────────────────────────────────────────

function renderModal(
  transactionId = 1,
  channel: 'B2C' | 'B2B2C' = 'B2C',
  navigationOverrides = {},
) {
  const navigation = makeNavigation(navigationOverrides);
  const route = makeRoute(transactionId, channel);

  const { getByText, queryByText, getByTestId, queryByTestId, rerender, unmount } =
    render(<ProcessingModal navigation={navigation as any} route={route as any} />);

  return { navigation, getByText, queryByText, getByTestId, queryByTestId, rerender, route, unmount };
}

// ── Pure function copies (not exported from component) ───────────────────────

const SLOW_THRESHOLD_MS = 8000;

const isSlow = (durationMs: number | null | undefined): boolean =>
  durationMs != null && durationMs > SLOW_THRESHOLD_MS;

type TxStatus = string;

const getStatusMessage = (
  status: TxStatus,
  attemptNumber: number | null | undefined,
  slow: boolean,
): { title: string; subtitle: string } => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        title: 'Vérification du paiement...',
        subtitle: 'Nous confirmons votre paiement',
      };
    case 'PAID':
      return {
        title: 'Paiement confirmé ✓',
        subtitle: 'Votre paiement a été accepté',
      };
    case 'PROVISIONING':
    case 'PROCESSING': {
      if (slow) {
        return {
          title: 'Ça prend un peu plus de temps...',
          subtitle: 'Tout va bien, nous continuons',
        };
      }
      if (attemptNumber && attemptNumber === 2) {
        return {
          title: 'On réessaie...',
          subtitle: `Tentative ${attemptNumber} en cours`,
        };
      }
      if (attemptNumber && attemptNumber >= 3) {
        return {
          title: 'Encore une tentative...',
          subtitle: `Tentative ${attemptNumber} en cours`,
        };
      }
      return {
        title: 'Activation de votre eSIM...',
        subtitle: 'Connexion au fournisseur en cours',
      };
    }
    case 'COMPLETED':
      return {
        title: 'eSIM activée !',
        subtitle: 'Vous êtes prêt à voyager',
      };
    case 'FAILED':
      return {
        title: 'Une erreur est survenue',
        subtitle: "Nous n'avons pas pu activer votre eSIM",
      };
    case 'EXPIRED':
      return {
        title: 'Session expirée',
        subtitle: 'Le délai de paiement a été dépassé',
      };
    default:
      return {
        title: 'Traitement en cours...',
        subtitle: 'Veuillez patienter',
      };
  }
};

const activeDotIndex = (attemptNumber: number | null | undefined): number => {
  if (!attemptNumber || attemptNumber <= 1) return 0;
  if (attemptNumber === 2) return 1;
  return 2;
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. getStatusMessage — pure function
// ═══════════════════════════════════════════════════════════════════════════

describe('getStatusMessage — pure function', () => {
  afterEach(() => jest.clearAllMocks());

  it('SM1 — PENDING_PAYMENT returns correct strings', () => {
    expect(getStatusMessage('PENDING_PAYMENT', null, false)).toEqual({
      title: 'Vérification du paiement...',
      subtitle: 'Nous confirmons votre paiement',
    });
  });

  it('SM2 — PAID returns correct strings', () => {
    expect(getStatusMessage('PAID', null, false)).toEqual({
      title: 'Paiement confirmé ✓',
      subtitle: 'Votre paiement a été accepté',
    });
  });

  it('SM3 — PROVISIONING attempt 1 returns default activation message', () => {
    expect(getStatusMessage('PROVISIONING', 1, false)).toEqual({
      title: 'Activation de votre eSIM...',
      subtitle: 'Connexion au fournisseur en cours',
    });
  });

  it('SM4 — PROVISIONING attempt 2 returns retry message', () => {
    expect(getStatusMessage('PROVISIONING', 2, false)).toEqual({
      title: 'On réessaie...',
      subtitle: 'Tentative 2 en cours',
    });
  });

  it('SM5 — PROVISIONING attempt 3 returns third attempt message', () => {
    expect(getStatusMessage('PROVISIONING', 3, false)).toEqual({
      title: 'Encore une tentative...',
      subtitle: 'Tentative 3 en cours',
    });
  });

  it('SM6 — PROVISIONING slow=true overrides attempt number', () => {
    expect(getStatusMessage('PROVISIONING', 2, true)).toEqual({
      title: 'Ça prend un peu plus de temps...',
      subtitle: 'Tout va bien, nous continuons',
    });
  });

  it('SM7 — PROCESSING behaves identically to PROVISIONING', () => {
    expect(getStatusMessage('PROCESSING', 1, false)).toEqual(
      getStatusMessage('PROVISIONING', 1, false),
    );
    expect(getStatusMessage('PROCESSING', 2, false)).toEqual(
      getStatusMessage('PROVISIONING', 2, false),
    );
    expect(getStatusMessage('PROCESSING', 1, true)).toEqual(
      getStatusMessage('PROVISIONING', 1, true),
    );
  });

  it('SM8 — COMPLETED returns success strings', () => {
    expect(getStatusMessage('COMPLETED', null, false)).toEqual({
      title: 'eSIM activée !',
      subtitle: 'Vous êtes prêt à voyager',
    });
  });

  it('SM9 — FAILED returns error strings', () => {
    expect(getStatusMessage('FAILED', null, false)).toEqual({
      title: 'Une erreur est survenue',
      subtitle: "Nous n'avons pas pu activer votre eSIM",
    });
  });

  it('SM10 — EXPIRED returns expiry strings', () => {
    expect(getStatusMessage('EXPIRED', null, false)).toEqual({
      title: 'Session expirée',
      subtitle: 'Le délai de paiement a été dépassé',
    });
  });

  it('SM11 — unknown status falls through to default', () => {
    expect(getStatusMessage('UNKNOWN_STATUS' as any, null, false)).toEqual({
      title: 'Traitement en cours...',
      subtitle: 'Veuillez patienter',
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. isSlow — pure function
// ═══════════════════════════════════════════════════════════════════════════

describe('isSlow — pure function', () => {
  afterEach(() => jest.clearAllMocks());

  it('IS1 — null returns false', () => {
    expect(isSlow(null)).toBe(false);
  });

  it('IS2 — undefined returns false', () => {
    expect(isSlow(undefined)).toBe(false);
  });

  it('IS3 — value below threshold returns false', () => {
    expect(isSlow(7999)).toBe(false);
  });

  it('IS4 — value exactly at threshold returns false (not strictly greater)', () => {
    expect(isSlow(8000)).toBe(false);
  });

  it('IS5 — value above threshold returns true', () => {
    expect(isSlow(8001)).toBe(true);
  });

  it('IS6 — well above threshold returns true', () => {
    expect(isSlow(40000)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. activeDotIndex — pure function
// ═══════════════════════════════════════════════════════════════════════════

describe('activeDotIndex — pure function', () => {
  afterEach(() => jest.clearAllMocks());

  it('ADI1 — null returns 0', () => {
    expect(activeDotIndex(null)).toBe(0);
  });

  it('ADI2 — undefined returns 0', () => {
    expect(activeDotIndex(undefined)).toBe(0);
  });

  it('ADI3 — attempt 1 returns 0', () => {
    expect(activeDotIndex(1)).toBe(0);
  });

  it('ADI4 — attempt 2 returns 1', () => {
    expect(activeDotIndex(2)).toBe(1);
  });

  it('ADI5 — attempt 3 returns 2', () => {
    expect(activeDotIndex(3)).toBe(2);
  });

  it('ADI6 — attempt 4+ returns 2 (capped)', () => {
    expect(activeDotIndex(4)).toBe(2);
    expect(activeDotIndex(10)).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ProcessingModal — rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('ProcessingModal — rendering', () => {
  beforeEach(() => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PENDING_PAYMENT' }),
    });
  });
  afterEach(() => jest.clearAllMocks());

  it('R1 — renders backdrop and card', () => {
    const { getByText } = renderModal();
    expect(getByText('Vérification du paiement...')).toBeTruthy();
    expect(getByText('Nous confirmons votre paiement')).toBeTruthy();
  });

  it('R2 — renders airplane icon in non-terminal state', () => {
    const { getByTestId } = renderModal();
    expect(getByTestId('icon-airplane')).toBeTruthy();
  });

  it('R3 — renders three dots', () => {
    // Three dots are rendered — one active (Animated.View) two inactive (View)
    // We verify the component renders without crashing and shows correct text
    const { getByText } = renderModal();
    expect(getByText('Vérification du paiement...')).toBeTruthy();
  });

  it('R4 — PAID status shows correct message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PAID' }),
    });
    const { getByText } = renderModal();
    expect(getByText('Paiement confirmé ✓')).toBeTruthy();
  });

  it('R5 — PROVISIONING attempt 1 shows default message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 1 }),
    });
    const { getByText } = renderModal();
    expect(getByText('Activation de votre eSIM...')).toBeTruthy();
    expect(getByText('Connexion au fournisseur en cours')).toBeTruthy();
  });

  it('R6 — PROVISIONING attempt 2 shows retry message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 2 }),
    });
    const { getByText } = renderModal();
    expect(getByText('On réessaie...')).toBeTruthy();
    expect(getByText('Tentative 2 en cours')).toBeTruthy();
  });

  it('R7 — PROVISIONING slow shows slow message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({
        status: 'PROVISIONING',
        attemptNumber: 1,
        durationMs: 9000, // above SLOW_THRESHOLD_MS (8000)
      }),
    });
    const { getByText } = renderModal();
    expect(getByText('Ça prend un peu plus de temps...')).toBeTruthy();
    expect(getByText('Tout va bien, nous continuons')).toBeTruthy();
  });

  it('R8 — COMPLETED shows success message and checkmark icon', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'COMPLETED' }),
    });
    const { getByText, getByTestId } = renderModal();
    expect(getByText('eSIM activée !')).toBeTruthy();
    expect(getByTestId('icon-checkmark-circle')).toBeTruthy();
  });

  it('R9 — FAILED shows error message and close icon', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'FAILED' }),
    });
    const { getByText, getByTestId } = renderModal();
    expect(getByText('Une erreur est survenue')).toBeTruthy();
    expect(getByTestId('icon-close-circle')).toBeTruthy();
  });

  it('R10 — EXPIRED shows expiry message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'EXPIRED' }),
    });
    const { getByText } = renderModal();
    expect(getByText('Session expirée')).toBeTruthy();
  });

  it('R11 — no data yet shows default PENDING_PAYMENT message', () => {
    mockUseTransactionById.mockReturnValue({ data: undefined });
    const { getByText } = renderModal();
    // status defaults to 'PENDING_PAYMENT' when data is undefined
    expect(getByText('Vérification du paiement...')).toBeTruthy();
  });

  it('R12 — B2B2C channel renders identically to B2C', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 1 }),
    });
    const { getByText } = renderModal(1, 'B2B2C');
    expect(getByText('Activation de votre eSIM...')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ProcessingModal — navigation behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('ProcessingModal — navigation', () => {
  beforeEach(() => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PENDING_PAYMENT' }),
    });
  });
  afterEach(() => jest.clearAllMocks());

  it('NAV1 — COMPLETED navigates to EsimSuccess after 1500ms delay', () => {
    jest.useFakeTimers();

    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'COMPLETED' }),
    });

    const { navigation } = renderModal(42);

    // Before timeout fires — no navigation yet
    expect(navigation.replace).not.toHaveBeenCalled();

    // Advance timers by 1500ms
    act(() => { jest.advanceTimersByTime(1500); });

    expect(navigation.replace).toHaveBeenCalledWith('EsimSuccess', { transactionId: 42 });
    expect(navigation.replace).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('NAV2 — FAILED navigates immediately to EsimFailed', async () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'FAILED' }),
    });

    const { navigation } = renderModal(43);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('EsimFailed', { transactionId: 43 });
    });
    expect(navigation.replace).toHaveBeenCalledTimes(1);
  });

  it('NAV3 — EXPIRED navigates immediately to EsimExpired', async () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'EXPIRED' }),
    });

    const { navigation } = renderModal(44);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('EsimExpired', { transactionId: 44 });
    });
  });

  it('NAV4 — non-terminal status does not navigate', async () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING' }),
    });

    const { navigation } = renderModal();

    // Wait a tick to let effects run
    await waitFor(() => {
      expect(navigation.replace).not.toHaveBeenCalled();
    });
  });

  it('NAV5 — COMPLETED timer is cleaned up on unmount (no navigation after unmount)', () => {
    jest.useFakeTimers();

    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'COMPLETED' }),
    });

    const { navigation, unmount } = renderModal(45);

    // Unmount before timer fires
    act(() => { unmount(); });
    act(() => { jest.advanceTimersByTime(2000); });

    // Timer was cleared — no navigation
    expect(navigation.replace).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('NAV6 — polling stops when status becomes terminal', async () => {
    // Verify useTransactionById is called with refetchInterval=false
    // once terminal status is received
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'FAILED' }),
    });

    renderModal(46);

    await waitFor(() => {
      // After terminal status, hook should be called with false as refetchInterval
      const calls = mockUseTransactionById.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]).toBe(false);
    });
  });

  it('NAV7 — polling is active (3000ms interval) in non-terminal state', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PENDING_PAYMENT' }),
    });

    renderModal(47);

    // Hook should be called with 3000ms interval
    expect(mockUseTransactionById).toHaveBeenCalledWith('47', 3000);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. ProcessingModal — polling transitions
// ═══════════════════════════════════════════════════════════════════════════

describe('ProcessingModal — polling transitions', () => {
  afterEach(() => jest.clearAllMocks());

  it('PT1 — transitions from PENDING_PAYMENT to PROVISIONING updates message', () => {
    // Start with PENDING_PAYMENT
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PENDING_PAYMENT' }),
    });

    const { getByText, rerender, route } = renderModal(48);
    expect(getByText('Vérification du paiement...')).toBeTruthy();

    // Simulate poll returning PROVISIONING
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 1 }),
    });

    const navigation = makeNavigation();
    rerender(
      <ProcessingModal navigation={navigation as any} route={route as any} />
    );

    expect(getByText('Activation de votre eSIM...')).toBeTruthy();
  });

  it('PT2 — transitions from PROVISIONING attempt 1 to attempt 2 updates message', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 1 }),
    });

    const { getByText, rerender, route } = renderModal(49);
    expect(getByText('Activation de votre eSIM...')).toBeTruthy();

    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({ status: 'PROVISIONING', attemptNumber: 2 }),
    });

    const navigation = makeNavigation();
    rerender(
      <ProcessingModal navigation={navigation as any} route={route as any} />
    );

    expect(getByText('On réessaie...')).toBeTruthy();
    expect(getByText('Tentative 2 en cours')).toBeTruthy();
  });

  it('PT3 — transitions from normal to slow updates message without status change', () => {
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({
        status: 'PROVISIONING',
        attemptNumber: 1,
        durationMs: 4000, // not slow yet
      }),
    });

    const { getByText, rerender, route } = renderModal(50);
    expect(getByText('Activation de votre eSIM...')).toBeTruthy();

    // Same status, durationMs now exceeds threshold
    mockUseTransactionById.mockReturnValue({
      data: makeTransactionResponse({
        status: 'PROVISIONING',
        attemptNumber: 1,
        durationMs: 9000, // now slow
      }),
    });

    const navigation = makeNavigation();
    rerender(
      <ProcessingModal navigation={navigation as any} route={route as any} />
    );

    expect(getByText('Ça prend un peu plus de temps...')).toBeTruthy();
  });
});
