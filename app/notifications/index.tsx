import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem as NotificationItemType,
} from '@/api/notifications';
import { AppHeader } from '@/components/app-header';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import * as React from 'react';
import { FlatList, Linking, Platform, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationItem from './_components/notification-item';
import { FilterIcon, NotificationIcon, PlusIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isInitializing } = useAuth();

  const notificationsQuery = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const refetchNotifications = notificationsQuery.refetch;

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !user) return;

    function refetchVisibleNotifications() {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      refetchNotifications();
    }

    globalThis.addEventListener?.('focus', refetchVisibleNotifications);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', refetchVisibleNotifications);
    }

    return () => {
      globalThis.removeEventListener?.('focus', refetchVisibleNotifications);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', refetchVisibleNotifications);
      }
    };
  }, [refetchNotifications, user]);

  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    onError: () => showAlert('알림', '읽음 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    onError: () => showAlert('알림', '모두 읽음 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const notifications = React.useMemo(
    () => notificationsQuery.data?.pages.flatMap((page) => page.content) ?? [],
    [notificationsQuery.data]
  );
  const hasUnread = notifications.some((item) => !item.read);

  async function openNotification(item: NotificationItemType) {
    if (!item.read) readMutation.mutate(item.id);
    if (!item.link) return;

    try {
      await Linking.openURL(item.link);
    } catch {
      showAlert('알림', '연결된 페이지를 열 수 없습니다.');
    }
  }

  // 로그인 안된 경우
  if (!isInitializing && !user) return <Redirect href="/login" />;

  return (
    <View className="flex-1 bg-white">
      {/* 앱 헤더 */}
      <View style={{ paddingTop: insets.top }}>
        <AppHeader
          title="알림"
          right={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="알림 설정"
              onPress={() => router.push('/notifications/keyword-alarms')}
              hitSlop={8}
            >
              <FilterIcon size={24} className="text-grey-30" />
            </TouchableOpacity>
          }
        />
      </View>

      {/* 알림 목록 렌더링 */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        /**
         * 알림 아이템
         */
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => openNotification(item)} />
        )}
        /**
         * 모두 읽음 버튼
         */
        ListHeaderComponent={
          notifications.length > 0 ? (
            <View className="items-end p-4">
              <TouchableOpacity
                onPress={() => readAllMutation.mutate()}
                disabled={!hasUnread || readAllMutation.isPending}
                hitSlop={4}
              >
                <Text
                  className={
                    hasUnread ? 'text-caption02 text-blue-20' : 'text-caption02 text-grey-30'
                  }
                >
                  모두 읽음
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        /**
         * 알림 목록이 비어 있는 경우
         */
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3">
            <NotificationIcon className="text-grey-10" size={36} />
            <Text className="text-body03 text-grey-30">새로운 알림이 없어요</Text>
            <Button
              className="flex-row items-center gap-1 rounded-xl pe-[16px] ps-[14px]"
              onPress={() => router.push('/notifications/keyword-alarms')}
            >
              <PlusIcon size={16} className="text-white" />
              <Text className="text-body04">키워드 추가하기</Text>
            </Button>
          </View>
        }
        /**
         * 새로고침 ui
         */
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => notificationsQuery.refetch()} />
        }
        /**
         * 무한 스크롤 트리거
         */
        onEndReached={() => {
          if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
            notificationsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
      />
    </View>
  );
}
