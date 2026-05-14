import { Platform } from 'react-native';
import { client } from './client';
import { setAccessToken, setRefreshToken, setSessionFlag } from './token';

const isWeb = Platform.OS === 'web';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string; // mobile only; web receives this as HttpOnly Cookie
};

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', body);

  await setAccessToken(data.accessToken);
  setSessionFlag();

  if (!isWeb && data.refreshToken) {
    await setRefreshToken(data.refreshToken);
  }

  return data;
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}
