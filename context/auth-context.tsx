import { clearTokens } from '@/api/token';
import { createContext, useCallback, useContext, useState } from 'react';

type User = {
  accessToken: string;
};

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
