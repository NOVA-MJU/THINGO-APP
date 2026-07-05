import { isAxiosError } from 'axios';

type ApiErrorBody = {
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorBody>(error)) return fallback;
  return error.response?.data?.message?.replace(/^\[[^\]]+\]\s*/, '') || fallback;
}
