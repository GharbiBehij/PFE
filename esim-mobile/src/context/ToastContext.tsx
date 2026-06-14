import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';
import { ToastBanner, ToastType } from '../components/ToastBanner';

type ToastOptions = {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ActiveToast = ToastOptions & { id: number };

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [active, setActive] = useState<ActiveToast | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setActive({ ...options, id: Date.now() });
  }, []);

  const handleDismiss = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {active && (
        <ToastBanner
          key={active.id}
          type={active.type}
          title={active.title}
          message={active.message}
          durationMs={active.durationMs}
          onDismiss={handleDismiss}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
