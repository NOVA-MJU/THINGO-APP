import { useAuth } from '@/context/auth-context';
import { Platform } from 'react-native';

// 알림(키워드 알림 설정, 알림 내역)을 쓸 수 있는지. 앱은 로그인하지 않아도 이 기기 기준으로 쓸 수 있고,
// 웹은 푸시를 받을 수 없어 로그인한 경우에만 쓴다
export function useAlarmAccess() {
  const { user, isInitializing } = useAuth();
  return {
    canUseAlarms: !!user || Platform.OS !== 'web',
    isGuest: !user,
    isInitializing,
  };
}
