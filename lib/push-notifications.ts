import {
  deleteDeviceToken,
  getNotifications,
  markNotificationAsRead,
  registerDeviceToken,
} from '@/api/notifications';
import { openLinkOrNavigate } from '@/lib/open-link';
import type { QueryClient } from '@tanstack/react-query';
import {
  getMessaging,
  getToken as getFcmToken,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_TOKEN_KEY = 'thingo.devicePushToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// registerCurrentDeviceForPush()와 토큰 갱신 리스너가 공통으로 사용하는 저장 로직
async function saveDeviceToken(token: string): Promise<void> {
  await registerDeviceToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
  await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
}

export async function registerCurrentDeviceForPush(): Promise<string | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let permission = await Notifications.getPermissionsAsync();

  if (permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }

  if (permission.status !== 'granted') return null;

  // 서버 /device-tokens 는 두 플랫폼 모두 실제 FCM 토큰(fcmToken)을 받도록 되어있음.
  // Android는 getDevicePushTokenAsync()가 이미 FCM 토큰을 반환하지만,
  // iOS는 APNs 원시 디바이스 토큰을 반환하므로 react-native-firebase로 FCM 토큰을 별도로 받아야 함
  let token: string;

  if (Platform.OS === 'ios') {
    const messaging = getMessaging();
    await registerDeviceForRemoteMessages(messaging);
    token = await getFcmToken(messaging);
  } else {
    token = (await Notifications.getDevicePushTokenAsync()).data;
  }

  await saveDeviceToken(token);

  return token;
}

export async function unregisterCurrentDeviceForPush(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  if (!token) return;

  await deleteDeviceToken(token);
  await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY);
}

// 로그인 상태를 유지하는 도중 재설치/기기 복원 등으로 토큰이 재발급되는 경우,
// 서버에 등록된 토큰이 무효화된 채로 남아 알림이 끊기지 않도록 갱신을 구독함
export function subscribeToPushTokenRefresh(): () => void {
  if (Platform.OS === 'ios') {
    const messaging = getMessaging();
    return onTokenRefresh(messaging, (newToken) => {
      void saveDeviceToken(newToken).catch(() => {});
    });
  }

  if (Platform.OS === 'android') {
    const subscription = Notifications.addPushTokenListener((token) => {
      void saveDeviceToken(token.data).catch(() => {});
    });
    return () => subscription.remove();
  }

  return () => {};
}

// 서버가 알림 ID를 보내지 않으므로 링크가 같은 미읽음 알림을 목록에서 찾아 읽음 처리함.
// 목록은 최신 페이지만 보므로 오래된 알림은 찾지 못할 수 있음. 읽음 처리 실패가 링크 이동을 막지 않도록 에러는 무시함
async function markNotificationsReadByLink(link: string, queryClient: QueryClient) {
  try {
    const page = await getNotifications();
    const targets = page.content.filter((item) => !item.read && item.link === link);
    if (targets.length === 0) return;

    await Promise.all(targets.map((item) => markNotificationAsRead(item.id)));
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  } catch {}
}

// 페이로드의 link 값으로 열기 방식을 나눔: 외부 URL은 브라우저 모달만 띄우고(알림 목록을 거치지 않음),
// 내부 경로는 해당 화면으로 이동, link가 없으면 알림 목록을 보여줌
function openNotificationResponse(
  response: Notifications.NotificationResponse,
  queryClient: QueryClient
) {
  const link = response.notification.request.content.data?.link;

  if (typeof link !== 'string' || !link) {
    router.push('/notifications');
    return;
  }

  void markNotificationsReadByLink(link, queryClient);
  void openLinkOrNavigate(link).catch(() => {});
}

// 알림을 탭해서 앱을 열었을 때 알림 링크로 이동시킴.
// 실행 중이던 앱을 백그라운드에서 탭한 경우엔 리스너가, 완전히 종료된 상태에서
// 탭해 앱이 새로 실행된 경우엔 리스너가 못 잡으므로 getLastNotificationResponseAsync로 별도 처리함
export function subscribeToNotificationTaps(queryClient: QueryClient): () => void {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return () => {};

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    openNotificationResponse(response, queryClient);
    void Notifications.clearLastNotificationResponseAsync();
  });

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    openNotificationResponse(response, queryClient);
  });

  return () => subscription.remove();
}
