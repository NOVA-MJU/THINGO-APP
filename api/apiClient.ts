import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './tokenStore';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
};

type TokenResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
};

const API_BASE_URL = 'https://api.thingo.kr/api/v1';
const MOBILE_CLIENT_TYPE = 'mobile';

let isRefreshing = false;
const queue: Pending[] = [];

/**
 * 추후 로그인 화면이 생기면 이 함수에서 router.replace('/login') 같은 처리를 붙이면 됩니다.
 * 지금은 토큰 정리까지만 담당하고, 화면 이동은 호출부에서 확장할 수 있게 비워둡니다.
 */
const handleUnauthorized = async () => {
  if (__DEV__) {
    console.log('[api/auth] 인증 만료 후 화면 이동 처리 자리');
  }
};

/**
 * 재발급 중 대기하던 요청들을 한 번에 처리합니다.
 *
 * 재발급 성공 시 새 accessToken을 Authorization 헤더에 넣고 원 요청을 재시도하고,
 * 실패 시 대기 요청을 모두 reject합니다.
 */
const flushQueue = (error: unknown, newToken?: string) => {
  while (queue.length) {
    const { resolve, reject, config } = queue.shift()!;

    if (error) {
      reject(error);
      continue;
    }

    if (newToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${newToken}`;
    }

    resolve(apiClient(config));
  }
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Type': MOBILE_CLIENT_TYPE,
  },
});

/**
 * 요청 인터셉터
 *
 * 일반 API 요청에는 accessToken을 Authorization 헤더로 붙입니다.
 * /auth/reissue 요청은 refreshToken을 따로 붙여야 하므로 여기서는 제외합니다.
 */
apiClient.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};
  config.headers['X-Client-Type'] = MOBILE_CLIENT_TYPE;

  const isReissue = (config.url ?? '').includes('/auth/reissue');
  if (!isReissue) {
    const accessToken = await getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  if (__DEV__) {
    // console.log('[api/request]', {
    //   method: config.method,
    //   url: config.url,
    //   hasAuthorization: !!config.headers.Authorization,
    // });
  }

  return config;
});

/**
 * refreshToken으로 accessToken을 재발급합니다.
 *
 * RN은 웹의 HttpOnly 쿠키를 안정적으로 사용할 수 없으므로,
 * SecureStore에 저장된 refreshToken을 직접 꺼내 Authorization 헤더로 보냅니다.
 */
const reissueAccessToken = async (): Promise<string> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token for reissue');
  }

  if (__DEV__) {
    console.log('[api/auth] accessToken 재발급 요청 시작');
  }

  const { data } = await apiClient.post<TokenResponse>(
    '/auth/reissue',
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'X-Client-Type': MOBILE_CLIENT_TYPE,
      },
    }
  );

  const newAccessToken = data?.data?.accessToken ?? data?.accessToken;
  const newRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;

  if (!newAccessToken) {
    throw new Error('No access token from reissue');
  }

  await setAccessToken(newAccessToken);

  if (newRefreshToken) {
    await setRefreshToken(newRefreshToken);
  }

  if (__DEV__) {
    console.log('[api/auth] accessToken 재발급 성공', {
      hasNewRefreshToken: !!newRefreshToken,
    });
  }

  return newAccessToken;
};

/**
 * 응답 인터셉터
 *
 * accessToken이 만료되어 401/403이 오면 refreshToken으로 재발급을 시도하고,
 * 성공 시 원래 요청을 새 accessToken으로 다시 보냅니다.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const url = original?.url ?? '';

    if (__DEV__) {
      console.error('[api/response] 요청 실패', {
        status,
        url,
        message: error.message,
      });
    }

    if (!original || (status !== 401 && status !== 403)) {
      return Promise.reject(error);
    }

    if (url.includes('/auth/login') || url.includes('/auth/reissue')) {
      return Promise.reject(error);
    }

    if (original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await reissueAccessToken();
      flushQueue(null, newAccessToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch (reissueError) {
      if (__DEV__) {
        console.error('[api/auth] accessToken 재발급 실패', reissueError);
      }

      await clearTokens();
      await handleUnauthorized();
      flushQueue(reissueError);
      return Promise.reject(reissueError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
