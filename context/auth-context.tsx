import { logout as logoutApi } from '@/api/auth';
import { getMemberInfo, type MemberInfo } from '@/api/members';
import { mergeDeviceAlarms } from '@/api/notifications';
import { clearTokens, hasSessionFlag } from '@/api/token';
import { showAlert } from '@/lib/alert';
import {
  registerCurrentDeviceForPush,
  subscribeToPushTokenRefresh,
  unregisterCurrentDeviceForPush,
} from '@/lib/push-notifications';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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

  // 로그인하면 계정으로, 로그인하지 않았으면 이 기기로 푸시를 받는다.
  // 비로그인 상태에서는 권한을 새로 묻지 않고 이미 허용된 경우에만 등록한다 (처음 알림을 설정할 때 묻는다)
  useEffect(() => {
    if (isInitializing) return;

    void registerCurrentDeviceForPush({ requestPermission: !!user }).catch(() => {});

    return subscribeToPushTokenRefresh();
  }, [user, isInitializing]);

  // 로그인 전에 이 기기에서 설정한 알림을 계정으로 옮긴다. 계정이 바뀌면 알림 설정·내역 캐시도 새로 받는다
  const userId = user?.uuid;
  useEffect(() => {
    if (isInitializing) return;

    void (async () => {
      if (userId) {
        // 옮길 알림이 없으면 서버가 0개로 응답하므로 앱을 켤 때마다 호출해도 안전하다
        const result = await mergeDeviceAlarms().catch(() => null);
        const movedCount = (result?.mergedCount ?? 0) + (result?.duplicateCount ?? 0);
        if (movedCount > 0) {
          const skippedNotice = result?.skippedCount
            ? `\n키워드는 최대 10개까지라 ${result.skippedCount}개는 옮기지 못했어요.`
            : '';
          showAlert(
            '알림',
            `이 기기에서 설정한 키워드 알림 ${movedCount}개를 계정으로 옮겼어요.${skippedNotice}`
          );
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['keyword-alarms'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    })();
  }, [userId, isInitializing, queryClient]);

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
