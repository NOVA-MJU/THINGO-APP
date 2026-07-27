import { getUnreadNotificationStatus } from '@/api/notifications';
import { useAuth } from '@/context/auth-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

// 메인 화면이 focus 될 때마다 미읽음 알림 여부 조회 (알림 아이콘 배지 표시용)
export function useNotificationBadge() {
  const { user } = useAuth();

  const { data, refetch } = useQuery({
    queryKey: ['notifications', 'unread-status'],
    queryFn: getUnreadNotificationStatus,
    enabled: !!user,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (user) refetch();
    }, [user, refetch])
  );

  return data?.hasUnread ?? false;
}
