import { isAxiosError } from 'axios';

type ApiErrorBody = {
  error?: string;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorBody>(error)) return fallback;
  // 응답 자체를 못 받은 경우는 서버 오류가 아니라 연결 문제라 사용자가 할 수 있는 일을 알려 준다
  if (!error.response) return '인터넷 연결을 확인한 뒤 다시 시도해주세요';
  return error.response.data?.message?.replace(/^\[[^\]]+\]\s*/, '') || fallback;
}

// 서버 ErrorResponse의 error 코드(예: GOOGLE_SIGNUP_EXPIRED). 코드에 따라 화면 이동이 달라질 때 쓴다
export function getApiErrorCode(error: unknown): string | undefined {
  return isAxiosError<ApiErrorBody>(error) ? error.response?.data?.error : undefined;
}
