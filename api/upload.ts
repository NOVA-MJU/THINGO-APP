import { Platform } from 'react-native';
import { client } from './client';

export const DOMAIN_VALUES = [
  'COMMUNITY_POST',
  'PROFILE_IMAGE',
  'DEPARTMENT_LOGO',
  'DEPARTMENT_SCHEDULE',
  'STUDENT_COUNCIL_NOTICE',
] as const;

export type UploadDomain = (typeof DOMAIN_VALUES)[number];

type UploadResponse = {
  success: boolean;
  data: string; // CDN URL
};

export async function uploadImage(uri: string, domain: UploadDomain): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, 'image.jpg');
  } else {
    formData.append('file', { uri, type: 'image/jpeg', name: 'image.jpg' } as unknown as Blob);
  }

  formData.append('domain', domain);

  const { data } = await client.post<UploadResponse>('/s3/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}
