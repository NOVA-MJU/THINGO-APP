import apiClient from './apiClient';
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore';

export interface ApiResponse<T = unknown> {
  status?: 'SUCCESS' | 'ERROR' | string;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface RegisterReq {
  name: string;
  email: string;
  password: string;
  gender: string;
  nickname: string;
  departmentName: string;
  studentNumber: number;
  profileImageUrl: string | null;
}

export interface UserInfo {
  uuid: string;
  name: string;
  email: string;
  profileImageUrl: string;
  gender: string;
  nickname: string;
  college: string;
  departmentName: string;
  departmentUuid: string;
  studentNumber: string;
  role: string;
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface LogoutResponse {
  message: string;
}

export type EmailVerifyResponse = ApiResponse<string>;
export type ResetPasswordResponse = ApiResponse<string>;

export type ReactNativeImageFile = {
  uri: string;
  name: string;
  type: string;
};

const readAccessToken = (response: LoginResponse) =>
  response.data?.accessToken ?? response.accessToken ?? null;

const readRefreshToken = (response: LoginResponse) =>
  response.data?.refreshToken ?? response.refreshToken ?? null;

/**
 * 로그인
 *
 * 웹은 refreshToken을 HttpOnly 쿠키로 받지만, RN은 쿠키 저장소에 의존하지 않습니다.
 * 따라서 모바일 로그인 응답 body에 accessToken과 refreshToken이 내려온다는 전제로
 * accessToken/refreshToken을 tokenStore에 저장합니다.
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  const accessToken = readAccessToken(data);
  const refreshToken = readRefreshToken(data);

  if (accessToken) {
    await setAccessToken(accessToken);
  }

  if (refreshToken) {
    await setRefreshToken(refreshToken);
  }

  if (__DEV__) {
    console.log('[user/api] 로그인 응답 처리', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
  }

  return data;
};

/**
 * 로그아웃
 *
 * 서버 로그아웃 요청은 시도하되, 성공/실패와 관계없이 앱에 저장된 토큰은 제거합니다.
 */
export const logout = async (): Promise<LogoutResponse> => {
  try {
    const { data } = await apiClient.post<LogoutResponse>('/auth/logout', {});
    return data;
  } finally {
    await clearTokens();
  }
};

/**
 * 회원정보 조회
 *
 * apiClient가 accessToken을 자동으로 Authorization 헤더에 붙입니다.
 */
export const saveUserInfo = async (): Promise<UserInfo> => {
  const { data } = await apiClient.get<ApiResponse<UserInfo>>('/members/info');
  if (!data.data) throw new Error('유저 데이터를 찾을 수 없습니다.');
  return data.data;
};

/**
 * 앱 부팅 시 세션 복구
 *
 * 저장된 refreshToken이 있으면 apiClient의 재발급 규칙과 같은 모바일 방식으로
 * /auth/reissue를 호출하고, 새 accessToken 저장 후 회원정보를 조회합니다.
 */
export const trySession = async (): Promise<UserInfo | null> => {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await clearTokens();
      return null;
    }

    const { data } = await apiClient.post<ApiResponse<LoginResponse> | LoginResponse>(
      '/auth/reissue',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          'X-Client-Type': 'mobile',
        },
      },
    );

    const payload = 'data' in data && data.data ? data.data : data;
    const newAccessToken = readAccessToken(payload);
    const newRefreshToken = readRefreshToken(payload);

    if (!newAccessToken) {
      await clearTokens();
      return null;
    }

    await setAccessToken(newAccessToken);

    if (newRefreshToken) {
      await setRefreshToken(newRefreshToken);
    }

    return saveUserInfo();
  } catch (error) {
    if (__DEV__) {
      console.error('[user/api] 세션 복구 실패', error);
    }

    await clearTokens();
    return null;
  }
};

/** 회원가입 */
export const registerMember = async (userData: RegisterReq): Promise<ApiResponse<unknown>> => {
  const response = await apiClient.post<ApiResponse<unknown>>('/members', userData);
  return response.data;
};

/** 이메일 중복 및 도메인 유효성 검사 */
export const checkEmailValidation = async (email: string): Promise<ApiResponse<boolean>> => {
  const response = await apiClient.get<ApiResponse<boolean>>('/members/validation/email', {
    params: { email },
  });
  return response.data;
};

/** 닉네임 중복 검증 */
export const checkNicknameValidation = async (nickname: string): Promise<ApiResponse<boolean>> => {
  const response = await apiClient.get<ApiResponse<boolean>>('/members/validation/nickname', {
    params: { nickname },
  });
  return response.data;
};

/** 학번 중복 검증 */
export const checkStuCodeValidation = async (
  studentCode: string,
): Promise<ApiResponse<boolean>> => {
  const response = await apiClient.get<ApiResponse<boolean>>('/members/validation/student-number', {
    params: { studentNumber: studentCode },
  });
  return response.data;
};

/** 이메일 인증코드 발송 */
export const emailVerification = async (email: string): Promise<ApiResponse<null>> => {
  const { data } = await apiClient.post<ApiResponse<null>>('/member/email/verify', { email });
  return data;
};

/** 이메일 인증 코드 체크 */
export const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
  const { data } = await apiClient.post<ApiResponse<{ matched: boolean }>>('/member/email/check', {
    email,
    code,
  });
  return data.data?.matched ?? false;
};

/**
 * 프로필 이미지 업로드 API
 *
 * 웹의 File 대신 RN에서는 expo-image-picker 등이 주는 uri/name/type 형태를 FormData에 담습니다.
 */
export const uploadProfileImage = async (imageFile: ReactNativeImageFile): Promise<string> => {
  const formData = new FormData();
  formData.append('file', imageFile as unknown as Blob);

  const response = await apiClient.post<ApiResponse<string>>('/members/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data ?? '';
};

/** 회원 탈퇴 */
export const deleteUser = async (password: string): Promise<number> => {
  const res = await apiClient.delete('/members/info', {
    data: { password },
  });
  return res.status;
};

/** 비밀번호 찾기 - 이메일 인증코드 발송 */
export const sendEmailExists = async (email: string): Promise<boolean> => {
  const { data } = await apiClient.post<EmailVerifyResponse>('/member/email/verify', { email });
  return !!data.data;
};

/** 회원 계정 복구 - 코드 검증 */
export const sendAuthority = async (email: string, code: string): Promise<boolean> => {
  const payload = { email, code };
  const res = await apiClient.post<ApiResponse<string>>('/members/recovery/verify-code', payload);
  return (
    res.status === 200 &&
    (!!res.data.data || ['SUCCESS', 'API 요청 성공'].includes(res.data.status as string))
  );
};

/** 회원 계정 복구 - 비밀번호 재설정 */
export const changePassword = async (email: string, newPassword: string): Promise<boolean> => {
  const { data } = await apiClient.post<ResetPasswordResponse>('/members/recovery/reset', {
    email,
    newPassword,
  });
  return data.status === 'SUCCESS';
};
