import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const DEVICE_ID_KEY = 'thingo.deviceId';

// 비로그인 알림은 푸시를 받을 수 있는 앱에서만 쓰므로 웹은 기기 ID를 만들지 않는다
const isNative = Platform.OS !== 'web';

// 앱 시작 직후 여러 요청이 동시에 기기 ID를 찾아도 서버에 기기를 한 번만 만들도록 진행 중인 조회를 공유한다
let deviceIdPromise: Promise<string | null> | null = null;

type CreateDeviceResponse = {
  data: { deviceId: string };
};

async function loadOrCreateDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) return stored;

  // client를 쓰면 요청 인터셉터가 다시 기기 ID를 찾으므로 axios로 직접 요청한다.
  // ID는 추측할 수 없도록 서버가 만들어 준 값을 쓴다 (비로그인 알림 설정·내역을 이 ID로 구분함)
  const { data } = await axios.post<CreateDeviceResponse>(`${BASE_URL}/devices`, null, {
    headers: { 'X-Client-Type': 'mobile' },
  });
  await SecureStore.setItemAsync(DEVICE_ID_KEY, data.data.deviceId);
  return data.data.deviceId;
}

// 서버가 모르는 기기 ID(DEVICE_ID_INVALID)를 받으면 지워서, 다음 요청 때 새 ID를 발급받게 한다
export async function resetDeviceId(): Promise<void> {
  deviceIdPromise = null;
  if (isNative) await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
}

// 이 기기의 ID. 처음 쓰는 기기면 서버에 등록해 받아온다. 실패하면 null을 돌려주고 다음 요청에서 다시 시도한다
export function getDeviceId(): Promise<string | null> {
  if (!isNative) return Promise.resolve(null);

  deviceIdPromise ??= loadOrCreateDeviceId().catch(() => {
    deviceIdPromise = null;
    return null;
  });
  return deviceIdPromise;
}
