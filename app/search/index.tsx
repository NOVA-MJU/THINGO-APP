import {
  ArrowRightIcon,
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
  SearchIcon,
  XIcon,
} from '@/components/icons';
import ArrowLeft from '@/components/icons/arrow-left';
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import {
  getAiSummary,
  getSearchSuggestions,
  getTopSearchKeywords,
  searchAll,
  type AiSummary,
  type SearchResults,
} from '@/api/search';
import { parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { Link, router } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  FlatList,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['ALL', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];
const MAX_RECENT_SEARCH_COUNT = 10;
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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = React.useState(TABS[0]);
  const [query, setQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [suggestedSearches, setSuggestedSearches] = React.useState<string[]>([]);
  const [popularSearches, setPopularSearches] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<SearchResults>(EMPTY_RESULTS);
  const [aiSummary, setAiSummary] = React.useState<AiSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAiSummaryLoading, setIsAiSummaryLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const canUseAiSummary = Platform.OS !== 'web';
  const trimmedQuery = query.trim();
  const hasResults =
    results.notices.length > 0 ||
    results.communities.length > 0 ||
    results.newspapers.length > 0 ||
    results.broadcasts.length > 0 ||
    results.calendars.length > 0;

  React.useEffect(() => {
    getTopSearchKeywords(10)
      .then(setPopularSearches)
      .catch(() => setPopularSearches([]));
  }, []);

  React.useEffect(() => {
    let isActive = true;

    if (!trimmedQuery) {
      setResults(EMPTY_RESULTS);
      setSuggestedSearches([]);
      setAiSummary(null);
      setIsLoading(false);
      setIsAiSummaryLoading(false);
      setErrorMessage(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      setIsAiSummaryLoading(canUseAiSummary);
      setErrorMessage(null);

      searchAll(trimmedQuery)
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

      getSearchSuggestions(trimmedQuery)
        .then((nextSuggestions) => {
          if (isActive) setSuggestedSearches(nextSuggestions);
        })
        .catch(() => {
          if (isActive) setSuggestedSearches([]);
        });

      if (canUseAiSummary) {
        getAiSummary(trimmedQuery)
          .then((nextSummary) => {
            if (isActive) setAiSummary(nextSummary);
          })
          .catch(() => {
            if (isActive) setAiSummary(null);
          })
          .finally(() => {
            if (isActive) setIsAiSummaryLoading(false);
          });
      } else {
        setAiSummary(null);
        setIsAiSummaryLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [canUseAiSummary, trimmedQuery]);

  function onClearRecentSearchHistoryPress(): void {
    setRecentSearches([]);
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

  function onRecentSearchPress(keyword: string): void {
    setQuery(keyword);
  }

  function onDeleteRecentSearchPress(keyword: string): void {
    setRecentSearches((prev) => prev.filter((k) => k !== keyword));
  }

  function onSuggestedSearchPress(keyword: string): void {
    addRecentSearch(keyword);
    setQuery(keyword);
  }

  function onPopularSearchPress(keyword: string): void {
    addRecentSearch(keyword);
    setQuery(keyword);
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

  function onBroadcastMorePress(): void {
    setCurrentTab('명대뉴스');
  }

  function onCalendarMorePress(): void {
    setCurrentTab('학사일정');
  }

  function shouldShowSection(tabName: string) {
    return currentTab === 'ALL' || currentTab === tabName;
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
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="min-h-screen w-screen">
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
              onSubmitEditing={() => addRecentSearch(trimmedQuery)}
              returnKeyType="search"
              style={{ padding: 0, lineHeight: undefined }}
              className="flex-1 text-body06 text-black outline-none"
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <CloseIcon />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 검색어 없는 경우 */}
        {!trimmedQuery && (
          <View>
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <View className="mt-8 gap-2.5">
                <View className="flex-row items-end justify-between px-4">
                  <Text className="text-body02 text-black">최근 검색어</Text>
                  <TouchableOpacity onPress={() => onClearRecentSearchHistoryPress()}>
                    <Text className="text-caption02 text-grey-60">전체 삭제</Text>
                  </TouchableOpacity>
                </View>
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
              </View>
            )}

            {/* 인기 검색어 */}
            {popularSearches.length > 0 && (
              <View className="mt-8 gap-3">
                <Text className="ms-4 text-body02 text-black">인기 검색어</Text>
                <FlatList
                  data={popularSearches}
                  numColumns={2}
                  scrollEnabled={false}
                  keyExtractor={(item, index) => `${item}-${index}`}
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
            )}
          </View>
        )}

        {/* 검색어 있는 경우 */}
        {!!trimmedQuery && (
          <View>
            <TabBar
              tabs={TABS}
              currentTab={currentTab}
              onTabPress={(i) => setCurrentTab(TABS[i])}
            />

            {suggestedSearches.length > 0 && (
              <View className="mt-4 gap-2.5">
                <Text className="ms-4 text-body02 text-black">추천 검색어</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  {suggestedSearches.map((keyword) => (
                    <TouchableOpacity key={keyword} onPress={() => onSuggestedSearchPress(keyword)}>
                      <View className="rounded-full bg-blue-05 px-3 py-1.5">
                        <Text className="text-body05 text-blue-35">{keyword}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {currentTab === 'ALL' && (isAiSummaryLoading || aiSummary) && (
              <View className="mx-4 mt-5 rounded-lg bg-grey-02 px-4 py-3">
                <Text className="text-body02 text-black">AI 요약</Text>
                {isAiSummaryLoading && (
                  <View className="items-start py-3">
                    <ActivityIndicator />
                  </View>
                )}
                {!isAiSummaryLoading && aiSummary && (
                  <View className="mt-2">
                    <Text className="text-body05 text-grey-80">{aiSummary.summary}</Text>
                    {aiSummary.sources.length > 0 && (
                      <View className="mt-3 gap-1">
                        {aiSummary.sources.slice(0, 3).map((source) => (
                          <Link key={source.url} href={source.url as `https://${string}`} asChild>
                            <TouchableOpacity>
                              <Text className="text-caption02 text-blue-35" numberOfLines={1}>
                                {source.title}
                              </Text>
                            </TouchableOpacity>
                          </Link>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {isLoading && (
              <View className="items-center justify-center py-16">
                <ActivityIndicator />
              </View>
            )}

            {!isLoading && errorMessage && (
              <View className="items-center justify-center px-4 py-16">
                <Text className="text-body05 text-grey-40">{errorMessage}</Text>
              </View>
            )}

            {!isLoading && !errorMessage && !hasResults && (
              <View className="items-center justify-center px-4 py-16">
                <Text className="text-body04 text-black">검색 결과가 없습니다.</Text>
                <Text className="mt-1 text-body05 text-grey-40">다른 검색어를 입력해보세요.</Text>
              </View>
            )}

            {/* 공지사항 검색 결과*/}
            {!isLoading && shouldShowSection('공지사항') && results.notices.length > 0 && (
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
            {!isLoading && shouldShowSection('게시판') && results.communities.length > 0 && (
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
                            <Text className="ms-1 text-caption02 text-grey-40">{item.likes}</Text>
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

            {/* 학사일정 검색 결과*/}
            {!isLoading && shouldShowSection('학사일정') && results.calendars.length > 0 && (
              <View className="py-5">
                <View className="flex-row items-center justify-between px-4">
                  <Text className="text-body02 text-black">학사일정</Text>
                  <TouchableOpacity onPress={() => onCalendarMorePress()}>
                    <ArrowRightIcon size={20} className="text-grey-60" />
                  </TouchableOpacity>
                </View>
                {getSectionItems(results.calendars).map((item) => (
                  <View key={item.id} className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                    <Text className="text-body05 text-black" numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text className="text-caption04 text-grey-30">
                      {formatSearchDate(item.date)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 명대신문 검색 결과*/}
            {!isLoading && shouldShowSection('명대신문') && results.newspapers.length > 0 && (
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
                            <Text className="mt-0.5 text-caption01 text-grey-30" numberOfLines={1}>
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

            {/* 명대뉴스 검색 결과*/}
            {!isLoading && shouldShowSection('명대뉴스') && results.broadcasts.length > 0 && (
              <View className="py-5">
                <View className="flex-row items-center justify-between px-4">
                  <Text className="text-body02 text-black">명대뉴스</Text>
                  <TouchableOpacity onPress={() => onBroadcastMorePress()}>
                    <ArrowRightIcon size={20} className="text-grey-60" />
                  </TouchableOpacity>
                </View>
                <View className="mt-2">
                  {getSectionItems(results.broadcasts).map((item) => (
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
          </View>
        )}
      </View>
    </ScrollView>
  );
}
