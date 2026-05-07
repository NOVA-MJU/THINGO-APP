import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'thingo.accessToken';
const REFRESH_TOKEN_KEY = 'thingo.refreshToken';

const isWeb = Platform.OS === 'web';

// 매 요청마다 SecureStore I/O를 피하기 위한 메모리 캐시
let memoryAccessToken: string | null = null;

// 메모리 우선, 앱 재시작 시 SecureStore에서 복구 (web은 메모리만)
export async function getAccessToken(): Promise<string | null> {
  if (memoryAccessToken) return memoryAccessToken;
  if (isWeb) return null;
  memoryAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  return memoryAccessToken;
}

export async function setAccessToken(token: string): Promise<void> {
  memoryAccessToken = token;
  if (!isWeb) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

// web은 refreshToken을 HttpOnly 쿠키로 관리하므로 JS에서 접근하지 않음
export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) return null;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  if (!isWeb) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  if (!isWeb) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }
}
