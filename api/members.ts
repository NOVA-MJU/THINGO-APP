import { client } from './client';

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

export async function getMemberInfo(): Promise<MemberInfo> {
  const { data } = await client.get<MemberInfoResponse>('/members/info');
  return data.data;
}
