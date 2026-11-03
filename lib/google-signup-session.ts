import type { GoogleSignupProfile } from '@/api/auth';

// 로그인 화면에서 받은 가입 정보를 가입 화면으로 넘긴다. signupToken이 주소창·방문 기록에 남지 않도록
// 라우트 파라미터 대신 메모리에만 두며, 앱 실행 중 진행 중인 구글 가입은 하나뿐이라 모듈 변수 하나로 충분하다
let pendingProfile: GoogleSignupProfile | null = null;

export function setPendingGoogleSignup(profile: GoogleSignupProfile | null) {
  pendingProfile = profile;
}

export function getPendingGoogleSignup(): GoogleSignupProfile | null {
  return pendingProfile;
}
