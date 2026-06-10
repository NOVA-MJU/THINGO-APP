import { client } from './client';

export type Banner = {
  uuid: string;
  title: string;
  oneLineIntro: string;
  imageUrl: string;
  category: string;
  linkUrl: string;
  displayOrder: number;
};

type BannersResponse = {
  status: string;
  data: Banner[];
  timestamp: string;
};

export async function getBanners(params?: { category?: string }): Promise<Banner[]> {
  const { data } = await client.get<BannersResponse>('/banners', { params });
  return data.data;
}
