import {
  ArrowRightIcon,
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
  LinkIcon,
  SearchIcon,
  XIcon,
} from '@/components/icons';
import ArrowLeft from '@/components/icons/arrow-left';
import { Skeleton } from '@/components/ui/skeleton';
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import {
  getAiSummary,
  getTopSearchKeywords,
  searchAll,
  type AiSummary,
  type SearchResults,
} from '@/api/search';
import { parseUTCDate } from '@/lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Link, router } from 'expo-router';
import * as React from 'react';
import { Image, FlatList, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['ALL', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];
const SECTION_RESULT_MAP: Record<string, keyof SearchResults> = {
  게시판: 'communities',
  공지사항: 'notices',
  학사일정: 'calendars',
  명대신문: 'newspapers',
  명대뉴스: 'broadcasts',
};
const MAX_RECENT_SEARCH_COUNT = 10;
const RECENT_SEARCHES_KEY = 'recent_searches';
const EMPTY_RESULTS: SearchResults = {
  notices: [],
  communities: [],
  newspapers: [],
  broadcasts: [],
  calendars: [],
};

const NOTICE_CATEGORY_LABELS: Record<string, string> = {
  all: '전체',
  general: '일반',
  academic: '학사',
  scholarship: '장학',
  career: '진로',
  activity: '학생활동',
  rule: '학칙개정',
};

const SUGGESTED_SEARCHES_BY_MONTH: Record<number, string[]> = {
  1: ['휴학', '복학', '장학금'],
  2: ['휴학', '복학', '장학금'],
  3: ['와이파이', '유고결석계', '수강정정', '등록금', '장학금'],
  7: ['휴학', '복학', '장학금'],
  8: ['휴학', '복학', '장학금'],
  9: ['와이파이', '유고결석계', '수강정정', '등록금', '장학금'],
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = React.useState(TABS[0]);
  const [query, setQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [popularSearches, setPopularSearches] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<SearchResults>(EMPTY_RESULTS);
  const [aiSummary, setAiSummary] = React.useState<AiSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const isRecentSearchesLoaded = React.useRef(false);

  const suggestedSearchKeywords = SUGGESTED_SEARCHES_BY_MONTH[new Date().getMonth() + 1] ?? [];
  const hasResults =
    results.notices.length > 0 ||
    results.communities.length > 0 ||
    results.newspapers.length > 0 ||
    results.broadcasts.length > 0 ||
    results.calendars.length > 0;

  const availableTabs = TABS.filter(
    (tab) => tab === 'ALL' || (results[SECTION_RESULT_MAP[tab]]?.length ?? 0) > 0
  );

  React.useEffect(() => {
    getTopSearchKeywords(10)
      .then(setPopularSearches)
      .catch(() => setPopularSearches([]));
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((stored) => {
        if (stored) setRecentSearches(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => {
        isRecentSearchesLoaded.current = true;
      });
  }, []);

  React.useEffect(() => {
    if (!isRecentSearchesLoaded.current) return;
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches)).catch(() => {});
  }, [recentSearches]);

  React.useEffect(() => {
    let isActive = true;

    if (!submittedQuery) {
      setResults(EMPTY_RESULTS);
      setAiSummary(null);
      setIsLoading(false);
      setIsAiSummaryLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setCurrentTab(TABS[0]);
    setIsAiSummaryLoading(true);
    setErrorMessage(null);

    searchAll(submittedQuery)
      .then((nextResults) => {
        if (isActive) setResults(nextResults);
      })
      .catch(() => {
        if (!isActive) return;
        setResults(EMPTY_RESULTS);
        setErrorMessage('검색 결과를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    getAiSummary(submittedQuery)
      .then((nextSummary) => {
        if (isActive) setAiSummary(nextSummary);
      })
      .catch(() => {
        if (isActive) setAiSummary(null);
      })
      .finally(() => {
        if (isActive) setIsAiSummaryLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [submittedQuery]);

  function submitSearch(keyword: string): void {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setQuery(trimmed);
    setSubmittedQuery(trimmed);
  }

  function addRecentSearch(keyword: string): void {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    setRecentSearches((prev) =>
      [trimmedKeyword, ...prev.filter((item) => item !== trimmedKeyword)].slice(
        0,
        MAX_RECENT_SEARCH_COUNT
      )
    );
  }

  function onClearRecentSearchHistoryPress(): void {
    setRecentSearches([]);
  }

  function onRecentSearchPress(keyword: string): void {
    submitSearch(keyword);
  }

  function onDeleteRecentSearchPress(keyword: string): void {
    setRecentSearches((prev) => prev.filter((k) => k !== keyword));
  }

  function onSuggestedSearchPress(keyword: string): void {
    submitSearch(keyword);
  }

  function onPopularSearchPress(keyword: string): void {
    submitSearch(keyword);
  }

  function onNoticeMorePress(): void {
    setCurrentTab('공지사항');
  }

  function onCommunityMorePress(): void {
    setCurrentTab('게시판');
  }

  function onNewspaperMorePress(): void {
    setCurrentTab('명대신문');
  }

  function shouldShowSection(tabName: string) {
    const key = SECTION_RESULT_MAP[tabName];
    const hasItems = key ? results[key].length > 0 : false;
    return hasItems && (currentTab === 'ALL' || currentTab === tabName);
  }

  function getSectionItems<T>(items: T[]) {
    return currentTab === 'ALL' ? items.slice(0, 3) : items;
  }

  function formatSearchDate(date: string) {
    try {
      const parsedDate = date.includes('T') ? new Date(date) : parseUTCDate(date);
      return format(parsedDate, 'yyyy.MM.dd');
    } catch {
      return date;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom, flexGrow: 1 }}
    >
      <View className="flex-1">
        <View className="flex-row items-center gap-3 pb-2 pe-5 ps-3 pt-3.5">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-black" />
          </TouchableOpacity>

          {/* 검색바 */}
          <View className="h-[36px] flex-1 flex-row items-center gap-2 rounded-full bg-grey-02 px-3">
            <SearchIcon className="text-grey-30" />
            <TextInput
              placeholder="검색어를 입력해 주세요"
              placeholderTextColor="#cdd0d4"
              multiline={false}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => submitSearch(query)}
              style={{ padding: 0, lineHeight: undefined }}
              className="flex-1 text-body06 text-black outline-none"
            />
            {!!query && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setSubmittedQuery('');
                }}
              >
                <CloseIcon />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 검색어 미입력 */}
        {!submittedQuery && (
          <View>
            {/* 최근 검색어 */}
            <View className="mt-8 gap-2.5">
              <View className="flex-row items-end justify-between px-4">
                <Text className="text-body02 text-black">최근 검색어</Text>
                <TouchableOpacity onPress={() => onClearRecentSearchHistoryPress()}>
                  <Text className="text-caption02 text-grey-60">전체 삭제</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.length === 0 ? (
                <Text className="px-4 text-body05 text-grey-30">최근 검색어 내역이 없습니다</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {recentSearches.map((keyword) => (
                    <View key={keyword} className="flex-row rounded-full border border-grey-10">
                      <TouchableOpacity onPress={() => onRecentSearchPress(keyword)}>
                        <Text className="my-1.5 me-[3px] ms-3 text-body05 text-grey-40">
                          {keyword}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDeleteRecentSearchPress(keyword)}>
                        <XIcon size={12} className="my-[10.5px] me-[11px] ms-[3px] text-grey-20" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 추천 검색어 */}
            {suggestedSearchKeywords.length > 0 && (
              <View className="mt-8 gap-2.5">
                <Text className="ms-4 text-body02 text-black">추천 검색어</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {suggestedSearchKeywords.map((keyword) => (
                    <TouchableOpacity key={keyword} onPress={() => onSuggestedSearchPress(keyword)}>
                      <View className="rounded-full bg-blue-05 px-3 py-1.5">
                        <Text className="text-body05 text-blue-35">{keyword}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 인기 검색어 */}
            <View className="mt-8 gap-3">
              <Text className="ms-4 text-body02 text-black">인기 검색어</Text>
              <FlatList
                data={popularSearches}
                numColumns={2}
                scrollEnabled={false}
                keyExtractor={(_, index) => String(index)}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                columnWrapperStyle={{ gap: 4 }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity className="flex-1" onPress={() => onPopularSearchPress(item)}>
                    <View className="flex-row">
                      <Text className="text-body04 text-blue-35">{index + 1}</Text>
                      <Text className="ms-1.5 text-body05 text-grey-40">{item}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

        {/* 검색 결과 */}
        {!!submittedQuery && (
          <View>
            {!isLoading && (
              <TabBar
                tabs={availableTabs}
                currentTab={currentTab}
                onTabPress={(i) => setCurrentTab(availableTabs[i])}
              />
            )}

            {isLoading && (
              <View>
                <View className="gap-3.5 px-4 py-5">
                  <Skeleton className="h-4 w-32" />
                  <View className="gap-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-5/6" />
                    <Skeleton className="h-3.5 w-4/6" />
                    <View className="mt-1 gap-1">
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-7 w-full" />
                    </View>
                  </View>
                </View>
                <View className="h-2 w-full bg-grey-02" />
                <View className="py-5">
                  <View className="flex-row items-center justify-between px-4">
                    <Skeleton className="h-4 w-16" />
                  </View>
                  {[0, 1, 2].map((i) => (
                    <View key={i} className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-20" />
                    </View>
                  ))}
                </View>
                <View className="py-5">
                  <View className="px-4">
                    <Skeleton className="h-4 w-16" />
                  </View>
                  {[0, 1, 2].map((i) => (
                    <View key={i} className="border-b border-grey-02 px-4 py-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-1 h-3.5 w-full" />
                      <Skeleton className="mt-0.5 h-3.5 w-4/5" />
                      <View className="mt-2 flex-row justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </View>
                    </View>
                  ))}
                </View>
                <View className="py-5">
                  <View className="px-4">
                    <Skeleton className="h-4 w-16" />
                  </View>
                  <View className="mt-2">
                    {[0, 1, 2].map((i) => (
                      <View key={i} className="flex-row items-center gap-4 px-4 py-3">
                        <Skeleton className="w-25 aspect-square rounded-sm" />
                        <View className="flex-1 gap-1">
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-20" />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {!isLoading && !!errorMessage && (
              <Text className="py-10 text-center text-body05 text-grey-40">{errorMessage}</Text>
            )}

            {!isLoading && !errorMessage && !hasResults && (
              <Text className="py-10 text-center text-body05 text-grey-40">
                검색 결과가 없습니다.
              </Text>
            )}

            {!isLoading && !errorMessage && hasResults && (
              <>
                {/* ai 요약 검색 결과 */}
                {currentTab === 'ALL' && (
                  <>
                    <View className="gap-3.5 px-4 py-5">
                      <Text className="text-body02 text-black">
                        <Text className="text-mju-primary">AI</Text> 요약 검색 결과
                      </Text>
                      {isAiSummaryLoading ? (
                        <View className="gap-2">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-5/6" />
                          <Skeleton className="h-3.5 w-4/6" />
                          <View className="mt-1 gap-1">
                            <Skeleton className="h-7 w-full" />
                            <Skeleton className="h-7 w-full" />
                            <Skeleton className="h-7 w-full" />
                          </View>
                        </View>
                      ) : aiSummary ? (
                        <>
                          <Text className="text-body05 text-grey-80">{aiSummary.summary}</Text>
                          <View>
                            {aiSummary.sources.map((source, index) => (
                              <View
                                key={index}
                                className="flex-row items-center gap-1 border-b border-grey-02 py-1"
                              >
                                <Text className="flex-1 text-body05 text-grey-30">
                                  {source.title}
                                </Text>
                                <Link href={source.url as `https://${string}`} asChild>
                                  <TouchableOpacity>
                                    <LinkIcon />
                                  </TouchableOpacity>
                                </Link>
                              </View>
                            ))}
                          </View>
                        </>
                      ) : null}
                    </View>
                    <View className="h-2 w-full bg-grey-02" />
                  </>
                )}

                {/* 공지사항 검색 결과*/}
                {shouldShowSection('공지사항') && (
                  <View className="py-5">
                    <View className="flex-row items-center justify-between px-4">
                      <Text className="text-body02 text-black">공지사항</Text>
                      <TouchableOpacity onPress={() => onNoticeMorePress()}>
                        <ArrowRightIcon size={20} className="text-grey-60" />
                      </TouchableOpacity>
                    </View>
                    {getSectionItems(results.notices).map((item) => (
                      <Link key={item.id} href={item.url as `https://${string}`} asChild>
                        <TouchableOpacity>
                          <View className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                            <Text className="text-caption01 text-blue-15">
                              {NOTICE_CATEGORY_LABELS[item.category] ?? item.category}
                            </Text>
                            <Text className="text-body05 text-black" numberOfLines={2}>
                              {item.title}
                            </Text>
                            <Text className="text-caption04 text-grey-30">
                              {formatSearchDate(item.date)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Link>
                    ))}
                  </View>
                )}

                {/* 커뮤니티 검색 결과*/}
                {shouldShowSection('게시판') && (
                  <View className="py-5">
                    <View className="flex-row items-center justify-between px-4">
                      <Text className="text-body02 text-black">커뮤니티</Text>
                      <TouchableOpacity onPress={() => onCommunityMorePress()}>
                        <ArrowRightIcon size={20} className="text-grey-60" />
                      </TouchableOpacity>
                    </View>
                    {getSectionItems(results.communities).map((item) => (
                      <Link key={item.id} href={`/posts/${item.id}`} asChild>
                        <TouchableOpacity>
                          <View className="border-b border-grey-02 px-4 py-2">
                            <Text className="text-body04 text-grey-80">{item.title}</Text>
                            <Text className="mt-1 text-body05 text-black" numberOfLines={2}>
                              {item.preview}
                            </Text>
                            <View className="mt-2 flex-row items-center justify-between">
                              <View className="flex-row items-center">
                                <HeartIcon className="text-blue-10" />
                                <Text className="ms-1 text-caption02 text-grey-40">
                                  {item.likes}
                                </Text>
                                <ChatBubbleIcon className="ms-2 text-blue-10" />
                                <Text className="ms-1 text-caption02 text-grey-40">
                                  {item.comments}
                                </Text>
                              </View>
                              <Text className="text-caption02 text-grey-40">
                                {formatSearchDate(item.date)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Link>
                    ))}
                  </View>
                )}

                {/* 명대신문 검색 결과*/}
                {shouldShowSection('명대신문') && (
                  <View className="py-5">
                    <View className="flex-row items-center justify-between px-4">
                      <Text className="text-body02 text-black">명대신문</Text>
                      <TouchableOpacity onPress={() => onNewspaperMorePress()}>
                        <ArrowRightIcon size={20} className="text-grey-60" />
                      </TouchableOpacity>
                    </View>
                    <View className="mt-2">
                      {getSectionItems(results.newspapers).map((item) => (
                        <Link key={item.id} href={item.url as `https://${string}`} asChild>
                          <TouchableOpacity>
                            <View className="flex-row items-center gap-4 px-4 py-3">
                              <Image
                                source={
                                  item.imageUrl
                                    ? { uri: item.imageUrl }
                                    : require('@/assets/news-default-thumbnail.jpg')
                                }
                                className="w-25 aspect-square rounded-sm border border-grey-10"
                              />
                              <View className="flex-1">
                                <Text className="text-body02 text-black" numberOfLines={1}>
                                  {item.title}
                                </Text>
                                <Text className="mt-0.5 text-body05 text-black" numberOfLines={2}>
                                  {item.preview}
                                </Text>
                                <Text
                                  className="mt-0.5 text-caption01 text-grey-30"
                                  numberOfLines={1}
                                >
                                  {item.author}
                                </Text>
                                <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                                  {formatSearchDate(item.date)}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </Link>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
