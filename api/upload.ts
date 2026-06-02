import { Platform } from 'react-native';
import { getAccessToken } from './token';

export const DOMAIN_VALUES = [
  'COMMUNITY_POST',
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

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const UPLOAD_PATH = '/s3/upload';

export async function uploadImage(
  uri: string,
  domain: UploadDomain,
  uuid?: string
): Promise<string> {
  const formData = await createUploadFormData(uri, domain, uuid);
  const response = await fetch(`${BASE_URL}${UPLOAD_PATH}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: await createUploadHeaders(),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(getUploadErrorMessage(responseText, response.status));
  }

  return parseUploadResponse(responseText).data;
}

async function createUploadFormData(uri: string, domain: UploadDomain, uuid?: string) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, getFileName(uri));
  } else {
    formData.append('file', {
      uri,
      name: getFileName(uri),
      type: getMimeType(uri),
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
    // Fall through to the generic error below.
  }

  throw new Error('이미지 업로드 응답을 확인할 수 없습니다.');
}

function getUploadErrorMessage(responseText: string, status: number) {
  if (!responseText) return `이미지 업로드 실패: ${status}`;

  try {
    const parsed = JSON.parse(responseText) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // Non-JSON error bodies are still useful enough to surface.
  }

  return responseText;
}

function getFileName(uri: string) {
  const fileName = uri.split('/').pop()?.split('?')[0];
  return fileName && /\.[a-z0-9]+$/i.test(fileName) ? fileName : 'image.jpg';
}

function getMimeType(uri: string) {
  const extension = getFileName(uri).split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}
