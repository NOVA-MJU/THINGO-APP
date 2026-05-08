import { client } from './client';

export type BroadcastItem = {
  title: string;
  url: string;
  thumbnailUrl: string;
  playlistTitle: string | null;
  publishedAt: string;
};

export type BroadcastParams = {
  page?: number;
  size?: number;
};

type PageSort = {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
};

type Pageable = {
  pageNumber: number;
  pageSize: number;
  sort: PageSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
};

export type BroadcastResponse = {
  content: BroadcastItem[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: PageSort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

// 명대방송국 목록 조회
export async function getBroadcasts(params?: BroadcastParams): Promise<BroadcastResponse> {
  const { data } = await client.get<ApiResponse<BroadcastResponse>>('/broadcast', { params });
  return data.data;
}
