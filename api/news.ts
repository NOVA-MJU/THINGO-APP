import { client } from './client';

export type NewsCategory = 'REPORT' | 'SOCIETY' | null;

export type NewsItem = {
  title: string;
  date: string;
  reporter: string;
  imageUrl: string;
  summary: string;
  link: string;
  category: 'REPORT' | 'SOCIETY';
};

export type NewsParams = {
  category?: NewsCategory;
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

export type NewsResponse = {
  content: NewsItem[];
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

// 명대뉴스 목록 조회
export async function getNews(params?: NewsParams): Promise<NewsResponse> {
  const { data } = await client.get<ApiResponse<NewsResponse>>('/news', { params });
  return data.data;
}
