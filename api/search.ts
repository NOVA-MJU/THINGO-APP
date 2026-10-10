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

type SearchDetailType =
  | 'NOTICE'
  | 'MJU_CALENDAR'
  | 'DEPARTMENT_NOTICE'
  | 'STUDENT_COUNCIL_NOTICE'
  | 'DEPARTMENT_SCHEDULE'
  | 'COMMUNITY'
  | 'NEWS'
  | 'BROADCAST';

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
  'DEPARTMENT_NOTICE',
  'STUDENT_COUNCIL_NOTICE',
  'COMMUNITY',
  'MJU_CALENDAR',
  'DEPARTMENT_SCHEDULE',
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

// 유형별 상위 결과를 요청 한 번으로 받는다. 유형마다 따로 요청하면(8개) 모바일의 서버당 동시 연결 제한으로
// 줄을 서서 느려지고, 서버의 인기 검색어도 한 번 검색에 8번 집계된다
async function searchOverview(keyword: string): Promise<SearchResponse[]> {
  const { data } = await client.get<ApiResponse<SearchResponse[]>>('/search/overview', {
    params: {
      keyword,
      types: SEARCH_DETAIL_TYPES.join(','),
      perType: SEARCH_PAGE_SIZE,
    },
  });

  return data.data;
}

// 서버는 유형 이름순으로 주므로, 화면에 묶어 보여주는 순서(SEARCH_DETAIL_TYPES)로 되돌린다.
// 같은 유형 안의 relevance 순서는 안정 정렬로 유지된다
function typeOrder(type?: string | null) {
  return SEARCH_DETAIL_TYPES.indexOf((type ?? '').toUpperCase() as SearchDetailType);
}

export async function searchAll(keyword: string): Promise<SearchResults> {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) return emptySearchResults();

  const searchResponses = await searchOverview(trimmedKeyword);

  const results = emptySearchResults();

  [...searchResponses]
    .sort((a, b) => typeOrder(a.type) - typeOrder(b.type))
    .forEach((item) => {
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
