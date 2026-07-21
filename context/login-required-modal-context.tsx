import { LoginRequiredModal } from '@/components/login-required-modal';
import { useRouter } from 'expo-router';
import * as React from 'react';

type LoginRequiredModalContextValue = {
  showLoginRequiredModal: () => void;
};

const LoginRequiredModalContext = React.createContext<LoginRequiredModalContextValue | null>(null);

export function LoginRequiredModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  const showLoginRequiredModal = React.useCallback(() => {
    setVisible(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setVisible(false);
  }, []);

  const goToLogin = React.useCallback(() => {
    setVisible(false);
    router.push('/login');
  }, [router]);

  return (
    <LoginRequiredModalContext.Provider value={{ showLoginRequiredModal }}>
      {children}
      <LoginRequiredModal visible={visible} onCancel={closeModal} onLogin={goToLogin} />
    </LoginRequiredModalContext.Provider>
  );
}

export function useLoginRequiredModal() {
  const context = React.useContext(LoginRequiredModalContext);
  if (!context) {
    throw new Error('useLoginRequiredModal must be used within LoginRequiredModalProvider');
  }
  return context;
}
