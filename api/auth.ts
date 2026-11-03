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

async function saveSession(accessToken: string, refreshToken?: string) {
  await setAccessToken(accessToken);
  setSessionFlag();

  if (!isWeb && refreshToken) {
    await setRefreshToken(refreshToken);
  }
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await client.post<LoginResponse>('/auth/login', body);
  await saveSession(data.accessToken, data.refreshToken);
  return data;
}

// 처음 온 학교 계정이 가입을 마치는 데 필요한 정보. signupToken은 서버가 검증한 구글 계정을 가리킨다
export type GoogleSignupProfile = {
  signupToken: string;
  email: string;
  name: string;
  profileImageUrl: string | null;
  // 서버가 구글 프로필 소속에서 찾은 학과. 가입 화면이 미리 골라 둔다
  college: string | null;
  departmentName: string | null;
};

export type GoogleLoginResult =
  | { type: 'loggedIn' }
  | { type: 'signupRequired'; profile: GoogleSignupProfile };

type GoogleAuthResponse = {
  data: {
    status: 'LOGGED_IN' | 'SIGNUP_REQUIRED';
    accessToken?: string;
    refreshToken?: string; // mobile only; web receives this as HttpOnly Cookie
    signupToken?: string;
    email?: string;
    name?: string;
    profileImageUrl?: string;
    college?: string;
    departmentName?: string;
  };
};

// 기존 회원이면 바로 로그인하고, 처음 온 학교 계정이면 가입에 쓸 정보를 돌려준다
export async function googleLogin(idToken: string): Promise<GoogleLoginResult> {
  const { data } = await client.post<GoogleAuthResponse>('/auth/google', { idToken });
  const result = data.data;

  if (result.status === 'LOGGED_IN' && result.accessToken) {
    await saveSession(result.accessToken, result.refreshToken);
    return { type: 'loggedIn' };
  }
  return {
    type: 'signupRequired',
    profile: {
      signupToken: result.signupToken ?? '',
      email: result.email ?? '',
      name: result.name ?? '',
      profileImageUrl: result.profileImageUrl ?? null,
      college: result.college ?? null,
      departmentName: result.departmentName ?? null,
    },
  };
}

export type GoogleSignupRequest = {
  signupToken: string;
  nickname: string;
  college: string;
  departmentName: string;
  studentNumber: string;
  profileImageUrl?: string;
  privacyAgreed: boolean;
};

export async function googleSignup(body: GoogleSignupRequest): Promise<void> {
  const { data } = await client.post<GoogleAuthResponse>('/auth/google/signup', body);
  if (data.data.accessToken) await saveSession(data.data.accessToken, data.data.refreshToken);
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}
