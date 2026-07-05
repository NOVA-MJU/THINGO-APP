import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem as NotificationItemType,
} from '@/api/notifications';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from './_components/notification-item';

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
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: !!user,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
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

  if (!isInitializing && !user) return <Redirect href="/login" />;

  return (
    <View className="flex-1 bg-grey-02">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="알림" />
        <View className="h-12 flex-row items-center justify-between border-b border-grey-10 px-4">
          <Pressable
            accessibilityRole="button"
            onPress={() => readAllMutation.mutate()}
            disabled={!hasUnread || readAllMutation.isPending}
            hitSlop={8}
          >
            <Text className={hasUnread ? 'text-body05 text-blue-35' : 'text-body05 text-grey-20'}>
              {readAllMutation.isPending ? '처리 중' : '모두 읽음'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile/keyword-alarms' as never)}
            hitSlop={8}
          >
            <Text className="text-body05 text-grey-60">알림 설정</Text>
          </Pressable>
        </View>
      </View>

      {notificationsQuery.isLoading || isInitializing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : notificationsQuery.isError ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-body05 text-grey-60">알림을 불러오지 못했어요.</Text>
          <Button variant="outline" className="mt-4" onPress={() => notificationsQuery.refetch()}>
            <Text>다시 시도</Text>
          </Button>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => openNotification(item)} />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          contentContainerStyle={{ flexGrow: 1, paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-4 py-20">
              <Text className="text-body04 text-grey-60">받은 알림이 없습니다.</Text>
              <Text className="mt-1 text-body05 text-grey-40">
                키워드를 등록하면 새로운 소식을 알려드릴게요.
              </Text>
            </View>
          }
          ListFooterComponent={
            notificationsQuery.isFetchingNextPage ? <ActivityIndicator className="py-5" /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching && !notificationsQuery.isFetchingNextPage}
              onRefresh={() => notificationsQuery.refetch()}
            />
          }
          onEndReached={() => {
            if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
              notificationsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
        />
      )}
    </View>
  );
}
