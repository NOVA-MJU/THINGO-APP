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
  college: string;
  departmentName: string;
  studentNumber: string;
  profileImageUrl?: string;
  privacyAgreed: boolean;
};

export type UpdateMemberRequest = {
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nickname: string;
  college: string;
  departmentName: string;
  studentNumber: string;
  profileImageUrl?: string | null;
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

export type MyPost = {
  uuid: string;
  title: string;
  previewContent: string;
  viewCount: number;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  author: string;
  liked: boolean;
};

type PageData<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

type MyPostsResponse = {
  data: PageData<MyPost>;
};

export type MyPostsPage = {
  posts: MyPost[];
  totalElements: number;
  totalPages: number;
};

// 내가 작성한 게시물 목록 조회
export async function getMyPosts(page = 0): Promise<MyPostsPage> {
  const { data } = await client.get<MyPostsResponse>('/members/posts', { params: { page } });
  const { content, totalElements, totalPages } = data.data;
  return { posts: content, totalElements, totalPages };
}

// 내가 좋아요 누른 게시글 목록 조회
export async function getMyLikedPosts(page = 0): Promise<MyPostsPage> {
  const { data } = await client.get<MyPostsResponse>('/profile/liked_posts', { params: { page } });
  const { content, totalElements, totalPages } = data.data;
  return { posts: content, totalElements, totalPages };
}

export type MyCommentedPost = {
  boardUuid: string;
  boardTitle: string;
  boardPreviewContent: string;
  commentUuid: string;
  commentPreviewContent: string;
};

type MyCommentedPostsResponse = {
  data: PageData<MyCommentedPost>;
};

export type MyCommentedPostsPage = {
  items: MyCommentedPost[];
  totalElements: number;
  totalPages: number;
};

// 내가 댓글 단 게시글 목록 조회
export async function getMyCommentedPosts(page = 0): Promise<MyCommentedPostsPage> {
  const { data } = await client.get<MyCommentedPostsResponse>('/profile/comments', {
    params: { page },
  });
  const { content, totalElements, totalPages } = data.data;
  return { items: content, totalElements, totalPages };
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
