import { logout as logoutApi } from '@/api/auth';
import { getMemberInfo, type MemberInfo } from '@/api/members';
import { clearTokens, hasSessionFlag } from '@/api/token';
import {
  registerCurrentDeviceForPush,
  unregisterCurrentDeviceForPush,
} from '@/lib/push-notifications';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  user: MemberInfo | null;
  setUser: (user: MemberInfo | null) => void;
  isInitializing: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MemberInfo | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    (async function () {
      try {
        // 저장된 세션이 있는지 검사
        if (!(await hasSessionFlag())) return;
        const member = await getMemberInfo();
        setUser(member);
      } catch {
        await clearTokens();
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    void registerCurrentDeviceForPush().catch(() => {});
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await unregisterCurrentDeviceForPush().catch(() => {});
      await logoutApi();
    } finally {
      await clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isInitializing, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
