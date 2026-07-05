import { client } from './client';

export type AlarmCategory = 'NOTICE' | 'MJU_CALENDAR' | 'COMMUNITY' | 'CAFETERIA';

export type KeywordAlarm = {
  id: number;
  keyword: string;
  categories: AlarmCategory[];
  createdAt: string;
};

export type NotificationType = 'NOTICE' | 'MJU_CALENDAR' | 'COMMUNITY' | 'WEEKLY_MENU';

export type NotificationItem = {
  id: number;
  matchedKeyword: string;
  type: NotificationType;
  title: string;
  link: string | null;
  read: boolean;
  sentAt: string;
};

export type NotificationPage = {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

type KeywordAlarmInput = {
  keyword: string;
  categories: AlarmCategory[];
};

export const NOTIFICATION_PAGE_SIZE = 20;

export async function getKeywordAlarms(): Promise<KeywordAlarm[]> {
  const { data } = await client.get<ApiResponse<KeywordAlarm[]>>('/keyword-alarms');
  return data.data;
}

export async function getRecommendedKeywords(): Promise<string[]> {
  const { data } = await client.get<ApiResponse<string[]>>('/keyword-alarms/recommended');
  return data.data;
}

export async function createKeywordAlarm(input: KeywordAlarmInput): Promise<KeywordAlarm> {
  const { data } = await client.post<ApiResponse<KeywordAlarm>>('/keyword-alarms', input);
  return data.data;
}

export async function updateKeywordAlarmCategories(
  id: number,
  categories: AlarmCategory[]
): Promise<KeywordAlarm> {
  const { data } = await client.patch<ApiResponse<KeywordAlarm>>(`/keyword-alarms/${id}`, {
    categories,
  });
  return data.data;
}

export async function deleteKeywordAlarm(id: number): Promise<void> {
  await client.delete(`/keyword-alarms/${id}`);
}

export async function registerDeviceToken(
  fcmToken: string,
  platform: DevicePlatform
): Promise<void> {
  await client.post('/device-tokens', { fcmToken, platform });
}

export async function deleteDeviceToken(fcmToken: string): Promise<void> {
  await client.delete('/device-tokens', { params: { fcmToken } });
}

export async function getNotifications(
  page = 0,
  size = NOTIFICATION_PAGE_SIZE
): Promise<NotificationPage> {
  const { data } = await client.get<ApiResponse<NotificationPage>>('/notifications', {
    params: { page, size },
  });
  return data.data;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await client.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const { data } = await client.patch<ApiResponse<number>>('/notifications/read-all');
  return data.data;
}
