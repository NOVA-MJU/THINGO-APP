import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from './token';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const isWeb = Platform.OS === 'web';
const CLIENT_TYPE = isWeb ? 'web' : 'mobile';

// 재발급 중 들어온 요청을 쌓아두는 큐
type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
};

let isRefreshing = false;
const queue: QueueItem[] = [];

const flushQueue = (error: unknown, newToken?: string) => {
  while (queue.length) {
    const { resolve, reject, config } = queue.shift()!;
    if (error) {
      reject(error);
      continue;
    }
    if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
    resolve(client(config));
  }
};

export const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': CLIENT_TYPE,
  },
});

// 모든 요청에 accessToken 첨부 (reissue 요청 제외)
client.interceptors.request.use(async (config) => {
  const isReissue = config.url?.includes('/auth/reissue');
  if (!isReissue) {
    const token = await getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// access token 재발급
const reissue = async (): Promise<string> => {
  let body: Record<string, string> = {};

  // mobile은 body에 refreshToken 첨부, web은 HttpOnly Cookie로 자동 처리
  if (!isWeb) {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('no_refresh_token');
    body = { refreshToken };
  }

  const { data } = await client.post('/auth/reissue', body);

  const newAccessToken = data?.data?.accessToken ?? data?.accessToken;
  if (!newAccessToken) throw new Error('no access token in reissue response');

  await setAccessToken(newAccessToken);
  return newAccessToken;
};

// 401/403 응답 시 reissue 후 원래 요청 재시도, 재발급 중 요청은 큐에서 대기
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (!original || (status !== 401 && status !== 403)) return Promise.reject(error);
    if (url.includes('/auth/login') || url.includes('/auth/reissue')) return Promise.reject(error);
    if (original._retry) return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await reissue();
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return await client(original);
    } catch (err) {
      await clearTokens();
      flushQueue(err);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
