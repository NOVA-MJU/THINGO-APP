import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'thingo.accessToken';
const REFRESH_TOKEN_KEY = 'thingo.refreshToken';

let memoryAccessToken: string | null = null;

/**
 * accessToken을 가져옵니다.
 *
 * 우선 메모리에 있는 값을 사용하고, 앱 재시작 등으로 메모리가 비어 있으면
 * SecureStore에 저장된 값을 다시 읽어와 메모리에 올립니다.
 */
export async function getAccessToken(): Promise<string | null> {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }

  const storedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  memoryAccessToken = storedAccessToken;
  return storedAccessToken;
}

/**
 * accessToken을 저장합니다.
 *
 * 일반 요청마다 빠르게 꺼내 쓸 수 있도록 메모리에도 저장하고,
 * 앱 재시작 후에도 유지되도록 SecureStore에도 저장합니다.
 */
export async function setAccessToken(token: string): Promise<void> {
  memoryAccessToken = token;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

/**
 * refreshToken을 가져옵니다.
 *
 * refreshToken은 accessToken 재발급에만 사용하므로 SecureStore에서 직접 읽습니다.
 */
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * refreshToken을 저장합니다.
 *
 * RN 앱은 웹의 HttpOnly 쿠키 저장소를 사용할 수 없으므로,
 * 로그인 응답 body로 받은 refreshToken을 SecureStore에 보관합니다.
 */
export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * 저장된 인증 토큰을 모두 제거합니다.
 *
 * 재발급 실패, 로그아웃, 세션 만료 처리에서 호출하면 됩니다.
 */
export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
