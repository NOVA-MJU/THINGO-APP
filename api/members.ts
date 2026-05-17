import { Platform } from 'react-native';
import { client } from './client';
import { setAccessToken, setRefreshToken, setSessionFlag } from './token';

const isWeb = Platform.OS === 'web';

export type MemberInfo = {
  uuid: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  gender: string;
  nickname: string;
  college: string;
  departmentName: string;
  studentNumber: string;
  createdAt: string;
  updatedAt: string;
  role: string;
};

type MemberInfoResponse = {
  data: MemberInfo;
};

export type ProfileStats = {
  nickname: string;
  postCount: number;
  commentCount: number;
  likedPostCount: number;
};

type ProfileStatsResponse = {
  data: ProfileStats;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
  nickname: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  college: string;
  departmentName: string;
  studentNumber: string;
  profileImageUrl?: string;
};

export type UpdateMemberRequest = {
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nickname: string;
  college: string;
  departmentName: string;
  studentNumber: string;
  profileImageUrl?: string;
};

// 마이페이지 통계 조회
export async function getProfileStats(): Promise<ProfileStats> {
  const { data } = await client.get<ProfileStatsResponse>('/profile');
  return data.data;
}

// 회원 정보 조회
export async function getMemberInfo(): Promise<MemberInfo> {
  const { data } = await client.get<MemberInfoResponse>('/members/info');
  return data.data;
}

// 학번 중복 검증
export async function validateStudentNumber(studentNumber: string): Promise<void> {
  await client.get('/members/validation/student-number', { params: { studentNumber } });
}

// 닉네임 중복 검증
export async function validateNickname(nickname: string): Promise<void> {
  await client.get('/members/validation/nickname', { params: { nickname } });
}

// 이메일 사용 가능 여부 검증
export async function validateEmail(email: string): Promise<void> {
  await client.get('/members/validation/email', { params: { email } });
}

// 이메일 인증코드 발송
export async function sendEmailVerificationCode(email: string): Promise<void> {
  await client.post('/member/email/verify', { email });
}

// 이메일 인증코드 검증
export async function checkEmailVerificationCode(email: string, code: string): Promise<boolean> {
  const { data } = await client.post<{ data: { matched: boolean } }>('/member/email/check', {
    email,
    code,
  });
  return data.data.matched;
}

// 회원 정보 수정
export async function updateMemberInfo(body: UpdateMemberRequest): Promise<MemberInfo> {
  const { data } = await client.patch<MemberInfoResponse>('/members/info', body);
  return data.data;
}

// 비밀번호 찾기용 이메일 존재 검증
export async function verifyRecoveryEmail(email: string): Promise<void> {
  await client.get('/members/recovery/email', { params: { email } });
}

// 비밀번호 찾기용 인증코드 검증
export async function verifyRecoveryCode(email: string, code: string): Promise<void> {
  await client.post('/members/recovery/verify-code', { email, code });
}

// 비밀번호 찾기 - 비밀번호 재설정
export async function resetPassword(email: string, newPassword: string): Promise<void> {
  await client.post('/members/recovery/reset', { email, newPassword });
}

// 비밀번호 변경
export async function changePassword(password: string, newPassword: string): Promise<void> {
  await client.patch('/members/info/password', { password, newPassword });
}

// 회원 탈퇴
export async function deleteAccount(password: string): Promise<void> {
  await client.delete('/members/info', { data: { password } });
}

// 회원가입 후 로그인 처리
export async function signup(body: SignupRequest): Promise<void> {
  const { data } = await client.post<{ data: { accessToken: string; refreshToken: string } }>(
    '/members',
    body
  );
  await setAccessToken(data.data.accessToken);
  setSessionFlag();
  if (!isWeb && data.data.refreshToken) {
    await setRefreshToken(data.data.refreshToken);
  }
}
