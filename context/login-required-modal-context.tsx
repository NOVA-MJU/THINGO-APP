import { isGoogleSignInAvailable } from '@/components/google-sign-in-button';
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

  // 시트에서 '이메일 계정으로 로그인'을 누른 경우라 로그인 화면에서 이메일 로그인을 펼쳐 둔다
  const goToLogin = React.useCallback(() => {
    setVisible(false);
    router.push({ pathname: '/login', params: isGoogleSignInAvailable ? { email: '1' } : {} });
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
