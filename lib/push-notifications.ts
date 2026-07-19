import { deleteDeviceToken, registerDeviceToken } from '@/api/notifications';
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

  // 네이티브 Android FCM 토큰
  const token = await Notifications.getDevicePushTokenAsync();

  await registerDeviceToken(token.data, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
  await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token.data);

  return token.data;
}

export async function unregisterCurrentDeviceForPush(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  const token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  if (!token) return;

  await deleteDeviceToken(token);
  await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY);
}
