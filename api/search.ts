import { client } from './client';

export type SearchResultType =
  | 'notice'
  | 'community'
  | 'news'
  | 'broadcast'
  | 'mju_calendar'
  | 'department_notice'
  | 'student_council_notice'
  | 'department_schedule';

export type SearchNoticeResult = {
  id: string;
  category: string;
  title: string;
  date: string;
  url: string;
};

export type SearchCommunityResult = {
  id: string;
  title: string;
  preview: string;
  likes: number;
  comments: number;
  date: string;
};

export type SearchNewspaperResult = {
  id: string;
  title: string;
  preview: string;
  author: string;
  date: string;
  url: string;
  imageUrl: string;
};

export type SearchBroadcastResult = {
  id: string;
  title: string;
  preview: string;
  date: string;
  url: string;
  imageUrl: string;
};

export type SearchCalendarResult = {
  id: string;
  title: string;
  date: string;
};

export type AiSummarySource = {
  title: string;
  url: string;
};

export type AiSummary = {
  query: string;
  summary: string;
  documentCount: number;
  sources: AiSummarySource[];
  recommendedKeywords: string[];
};

export type SearchResults = {
  notices: SearchNoticeResult[];
  communities: SearchCommunityResult[];
  newspapers: SearchNewspaperResult[];
  broadcasts: SearchBroadcastResult[];
  calendars: SearchCalendarResult[];
};

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

type SearchResponse = {
  id: string;
  highlightedTitle?: string | null;
  highlightedContent?: string | null;
  date?: string | null;
  link?: string | null;
  category?: string | null;
  type?: SearchResultType | string | null;
  imageUrl?: string | null;
  score?: number | null;
  authorName?: string | null;
  likeCount?: number | null;
  commentCount?: number | null;
};

type SearchPageResponse = {
  content: SearchResponse[];
  totalElements: number;
  totalPages: number;
};

type SearchDetailType = 'NOTICE' | 'COMMUNITY' | 'MJU_CALENDAR' | 'NEWS' | 'BROADCAST';

type AiSummaryResponse = {
  query: string;
  summary: string;
  document_count?: number;
  documentCount?: number;
  sources?: AiSummarySource[];
  source_links?: string[];
  recommended_keywords?: string[];
  recommendedKeywords?: string[];
};

const SEARCH_PAGE_SIZE = 20;
const SEARCH_DETAIL_TYPES: SearchDetailType[] = [
  'NOTICE',
  'COMMUNITY',
  'MJU_CALENDAR',
  'NEWS',
  'BROADCAST',
];

function stripHighlight(value?: string | null) {
  return (value ?? '').replace(/<[^>]*>/g, '').trim();
}

function stripTypePrefix(id: string) {
  return id.includes(':') ? id.split(':').slice(1).join(':') : id;
}

function normalizeSearchResultType(type?: string | null): SearchResultType | null {
  const normalizedType = type?.toLowerCase();

  if (
    normalizedType === 'notice' ||
    normalizedType === 'community' ||
    normalizedType === 'news' ||
    normalizedType === 'broadcast' ||
    normalizedType === 'mju_calendar' ||
    normalizedType === 'department_notice' ||
    normalizedType === 'student_council_notice' ||
    normalizedType === 'department_schedule'
  ) {
    return normalizedType;
  }

  return null;
}

function emptySearchResults(): SearchResults {
  return {
    notices: [],
    communities: [],
    newspapers: [],
    broadcasts: [],
    calendars: [],
  };
}

async function searchDetail(keyword: string, type: SearchDetailType): Promise<SearchResponse[]> {
  const { data } = await client.get<ApiResponse<SearchPageResponse>>('/search/detail', {
    params: {
      keyword,
      type,
      page: 0,
      size: SEARCH_PAGE_SIZE,
      order: 'relevance',
    },
  });

  return data.data.content;
}

export async function searchAll(keyword: string): Promise<SearchResults> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return emptySearchResults();

  const searchResponses = await Promise.all(
    SEARCH_DETAIL_TYPES.map((type) => searchDetail(trimmedKeyword, type))
  );

  const results = emptySearchResults();

  searchResponses.flat().forEach((item) => {
    const title = stripHighlight(item.highlightedTitle);
    const preview = stripHighlight(item.highlightedContent);
    const date = item.date ?? '';

    switch (normalizeSearchResultType(item.type)) {
      case 'notice':
      case 'department_notice':
      case 'student_council_notice':
        results.notices.push({
          id: item.id,
          category: item.category ?? '',
          title,
          date,
          url: item.link ?? '',
        });
        break;
      case 'community':
        results.communities.push({
          id: stripTypePrefix(item.id),
          title,
          preview,
          likes: item.likeCount ?? 0,
          comments: item.commentCount ?? 0,
          date,
        });
        break;
      case 'news':
        results.newspapers.push({
          id: item.id,
          title,
          preview,
          author: item.authorName ?? '',
          date,
          url: item.link ?? '',
          imageUrl: item.imageUrl ?? '',
        });
        break;
      case 'broadcast':
        results.broadcasts.push({
          id: item.id,
          title,
          preview,
          date,
          url: item.link ?? '',
          imageUrl: item.imageUrl ?? '',
        });
        break;
      case 'mju_calendar':
      case 'department_schedule':
        results.calendars.push({
          id: stripTypePrefix(item.id),
          title,
          date,
        });
        break;
    }
  });

  return results;
}

export async function getSearchAutocomplete(keyword: string): Promise<string[]> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return [];

  const { data } = await client.get<ApiResponse<string[]>>('/search/suggest', {
    params: { keyword: trimmedKeyword },
  });

  return data.data;
}

export async function getTopSearchKeywords(count = 10): Promise<string[]> {
  const { data } = await client.get<ApiResponse<string[]>>('/keywords/top10', {
    params: { count },
  });

  return data.data;
}

export async function getAiSummary(query: string): Promise<AiSummary | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return null;

  const { data } = await client.get<AiSummaryResponse>('/ai/summary', {
    params: { query: trimmedQuery },
  });

  return {
    query: data.query,
    summary: data.summary,
    documentCount: data.document_count ?? data.documentCount ?? 0,
    sources:
      data.sources ??
      data.source_links?.map((url) => ({
        title: url,
        url,
      })) ??
      [],
    recommendedKeywords: data.recommended_keywords ?? data.recommendedKeywords ?? [],
  };
}
