import * as React from 'react';

export type GoogleSignInButtonProps = {
  // 구글이 발급한 ID 토큰. 서버가 학교 계정(@mju.ac.kr)인지 검증한다
  onIdToken: (idToken: string) => void;
  disabled?: boolean;
};

// 구글 클라이언트 ID가 설정되지 않은 빌드에서는 버튼을 숨긴다
export declare const isGoogleSignInAvailable: boolean;

export declare function GoogleSignInButton(
  props: GoogleSignInButtonProps
): React.ReactElement | null;
