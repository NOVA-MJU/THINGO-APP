import { client } from './client';

export type NoticeCategory =
  | 'all'
  | 'general'
  | 'academic'
  | 'scholarship'
  | 'career'
  | 'activity'
  | 'rule';
export type NoticeSort = 'asc' | 'desc';

export type Notice = {
  title: string;
  date: string;
  category: string;
  link: string;
};

export type NoticesParams = {
  category: NoticeCategory;
  year?: number;
  page?: number;
  size?: number;
  sort?: NoticeSort;
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

export type NoticesResponse = {
  content: Notice[];
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

// 공지사항 목록 조회
export async function getNotices(params: NoticesParams): Promise<NoticesResponse> {
  const { data } = await client.get<NoticesResponse>('/notices', { params });
  return data;
}
