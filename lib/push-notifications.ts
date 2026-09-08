import { deleteDeviceToken, registerDeviceToken } from '@/api/notifications';
import {
  getMessaging,
  getToken as getFcmToken,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
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

  await registerDeviceToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
  await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);

  return token;
}

export async function unregisterCurrentDeviceForPush(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  if (!token) return;

  await deleteDeviceToken(token);
  await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY);
}
