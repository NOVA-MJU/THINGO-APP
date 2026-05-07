import { Platform } from 'react-native';
import { client } from './client';
import { setAccessToken, setRefreshToken } from './token';

const isWeb = Platform.OS === 'web';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
};

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', body);

  await setAccessToken(data.accessToken);

  // mobile: refreshToken은 응답 헤더나 별도 필드로 올 수 있음
  // web: HttpOnly 쿠키로 자동 처리됨
  if (!isWeb) {
    const refreshToken = (data as unknown as Record<string, string>).refreshToken;
    if (refreshToken) await setRefreshToken(refreshToken);
  }

  return data;
}
