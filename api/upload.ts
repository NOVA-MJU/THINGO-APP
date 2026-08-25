import { Platform } from 'react-native';
import { getAccessToken } from './token';

export const DOMAIN_VALUES = [
  'COMMUNITY_POST',
  'REVIEW_MEDIA',
  'PROFILE_IMAGE',
  'DEPARTMENT_LOGO',
  'DEPARTMENT_SCHEDULE',
  'STUDENT_COUNCIL_NOTICE',
] as const;

export type UploadDomain = (typeof DOMAIN_VALUES)[number];

type UploadResponse = {
  success?: boolean;
  status?: string;
  data: string;
  message?: string;
};

type UploadFileInput = {
  uri: string;
  domain: UploadDomain;
  uuid?: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: File | Blob | null;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const UPLOAD_PATH = '/s3/upload';
const UPLOAD_TIMEOUT_MS = 120_000;
const GENERIC_UPLOAD_ERROR_MESSAGE = '업로드에 실패했습니다. 잠시 후 다시 시도해주세요.';

export async function uploadImage(
  uri: string,
  domain: UploadDomain,
  uuid?: string
): Promise<string> {
  return uploadFile({ uri, domain, uuid });
}

export async function uploadFile(input: UploadFileInput): Promise<string> {
  const formData = await createUploadFormData(input);
  const response = await fetchWithTimeout(
    `${BASE_URL}${UPLOAD_PATH}`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: await createUploadHeaders(),
    },
    UPLOAD_TIMEOUT_MS
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(getUploadErrorMessage(responseText, response.status));
  }

  return parseUploadResponse(responseText).data;
}

async function createUploadFormData({
  uri,
  domain,
  uuid,
  fileName,
  mimeType,
  file,
}: UploadFileInput) {
  const formData = new FormData();
  const browserFileName =
    typeof File !== 'undefined' && file instanceof File ? file.name : undefined;
  const browserMimeType = file?.type;
  const resolvedFileName = getFileName(
    uri,
    fileName ?? browserFileName,
    mimeType ?? browserMimeType
  );
  const resolvedMimeType = mimeType ?? browserMimeType ?? getMimeType(resolvedFileName);

  if (Platform.OS === 'web') {
    if (file) {
      formData.append('file', file, resolvedFileName);
    } else {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, resolvedFileName);
    }
  } else {
    formData.append('file', {
      uri,
      name: resolvedFileName,
      type: resolvedMimeType,
    } as unknown as Blob);
  }

  formData.append('domain', domain);
  if (uuid) formData.append('uuid', uuid);

  return formData;
}

async function createUploadHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': Platform.OS === 'web' ? 'web' : 'mobile',
  };

  const accessToken = await getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return headers;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        '업로드 시간이 초과되었습니다. 더 짧거나 용량이 작은 파일로 다시 시도해주세요.'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseUploadResponse(responseText: string): UploadResponse {
  try {
    const parsed = JSON.parse(responseText) as Partial<UploadResponse>;

    if (typeof parsed.data === 'string' && parsed.data.length > 0) {
      return {
        success: parsed.success,
        status: typeof parsed.status === 'string' ? parsed.status : undefined,
        data: parsed.data,
        message: typeof parsed.message === 'string' ? parsed.message : undefined,
      };
    }
  } catch {
    // 공통 에러 처리로 이동
  }

  throw new Error('업로드 응답을 확인할 수 없습니다.');
}

function getUploadErrorMessage(responseText: string, status: number) {
  if (status === 413) {
    return '파일 용량이 너무 큽니다. 더 짧거나 용량이 작은 영상으로 다시 시도해주세요.';
  }
  if (!responseText) return GENERIC_UPLOAD_ERROR_MESSAGE;

  try {
    const parsed = JSON.parse(responseText) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // 비JSON 응답 정규화로 이동
  }

  if (responseText.includes('413 Request Entity Too Large')) {
    return '파일 용량이 너무 큽니다. 더 짧거나 용량이 작은 영상으로 다시 시도해주세요.';
  }

  if (isHtmlResponse(responseText) || isLikelyRawErrorPage(responseText)) {
    return GENERIC_UPLOAD_ERROR_MESSAGE;
  }

  return responseText;
}

function isHtmlResponse(responseText: string) {
  const normalized = responseText.trim().toLowerCase();
  return (
    normalized.startsWith('<!doctype html') ||
    normalized.startsWith('<html') ||
    normalized.includes('<body') ||
    normalized.includes('</html>')
  );
}

function isLikelyRawErrorPage(responseText: string) {
  return responseText.length > 300 || /<(head|title|center|hr)\b/i.test(responseText);
}

function getFileName(uri: string, preferredFileName?: string | null, mimeType?: string | null) {
  const uriFileName = uri.split('/').pop()?.split('?')[0];
  const fileName = preferredFileName || uriFileName;
  if (fileName && /\.[a-z0-9]+$/i.test(fileName)) return fileName;
  return mimeType?.startsWith('video/') ? 'upload.mp4' : 'upload.jpg';
}

function getMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
      return 'video/x-m4v';
    case 'webm':
      return 'video/webm';
    default:
      return 'image/jpeg';
  }
}
