import {
  getMapSearchResults,
  getMapSearchSuggestions,
  MAP_SEARCH_PAGE_SIZE,
  type MapSearchItem,
  type MapSearchSuggestion,
} from '@/api/maps';
import { ArrowLeftIcon, SearchIcon, XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { formatMapDistance, getOperatingStatusClassName } from '@/lib/maps/format';
import { getMapIcon, getMapIconClassName } from '@/lib/maps/icons';
import { cn } from '@/lib/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMapSearchSelection } from '@/context/map-search-selection';

const MAX_RECENT_SEARCH_COUNT = 10;
const RECENT_SEARCHES_KEY = 'map_recent_searches';
const AUTOCOMPLETE_DEBOUNCE_MS = 250;

type SearchCoordinates = {
  latitude: number;
  longitude: number;
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

export default function MapsSearchScreen() {
  const inset = useSafeAreaInsets();
  const router = useRouter();
  const { selectSearchResult } = useMapSearchSelection();
  const inputRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');
  const [submittedKeyword, setSubmittedKeyword] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [coordinates, setCoordinates] = React.useState<SearchCoordinates | null>(null);
  const isRecentSearchesLoaded = React.useRef(false);

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, AUTOCOMPLETE_DEBOUNCE_MS);
  const isEditing = !!trimmedQuery && trimmedQuery !== submittedKeyword;

  // 검색어 자동완성 요청
  const suggestionsQuery = useQuery({
    queryKey: ['map-search-suggestions', debouncedQuery],
    queryFn: () => getMapSearchSuggestions({ keyword: debouncedQuery }),
    enabled: !!debouncedQuery && debouncedQuery === trimmedQuery && isEditing,
    staleTime: 30_000,
  });

  // 검색 요청
  const searchQuery = useInfiniteQuery({
    queryKey: ['map-search', submittedKeyword, coordinates?.latitude, coordinates?.longitude],
    queryFn: ({ pageParam }) =>
      getMapSearchResults({
        keyword: submittedKeyword,
        lat: coordinates?.latitude,
        lng: coordinates?.longitude,
        page: pageParam,
        size: MAP_SEARCH_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < MAP_SEARCH_PAGE_SIZE ? undefined : pages.length,
    enabled: !!submittedKeyword,
  });

  // 페이지별로 나뉜 결과를 하나의 리스트로 평탄화
  const searchResults = React.useMemo(
    () => searchQuery.data?.pages.flat() ?? [],
    [searchQuery.data]
  );

  // 화면 진입 시 검색창에 자동 포커스(레이아웃 완료 후 포커스가 걸리도록 약간 지연)
  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // 저장된 최근 검색어 로드
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

  // 최근 검색어가 바뀔 때마다 저장(로드 완료 전에는 빈 배열로 덮어쓰지 않도록 가드)
  React.useEffect(() => {
    if (!isRecentSearchesLoaded.current) return;
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches)).catch(() => {});
  }, [recentSearches]);

  // 권한이 이미 허용된 경우에만 마지막으로 알려진 위치를 가져와 거리 계산에 사용
  React.useEffect(() => {
    let active = true;

    async function loadLastKnownLocation() {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const location = await Location.getLastKnownPositionAsync();
        if (!active || !location) return;

        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch {
        // 위치를 사용할 수 없어도 검색은 거리 정보 없이 정상 동작합니다.
      }
    }

    void loadLastKnownLocation();
    return () => {
      active = false;
    };
  }, []);

  // 최근 검색어 추가
  function addRecentSearch(keyword: string) {
    setRecentSearches((prev) =>
      [keyword, ...prev.filter((recent) => recent !== keyword)].slice(0, MAX_RECENT_SEARCH_COUNT)
    );
  }

  // 검색 결과 조회
  function runSearch(keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    setQuery(trimmedKeyword);
    setSubmittedKeyword(trimmedKeyword);
    addRecentSearch(trimmedKeyword);
    Keyboard.dismiss();
  }

  // 입력한 검색어 삭제
  function onClearQueryPress() {
    setQuery('');
    setSubmittedKeyword('');
    inputRef.current?.focus();
  }

  // 검색 결과 클릭 시 선택한 장소를 지도 화면으로 전달하고 검색창 닫기
  function onSearchResultPress(item: MapSearchItem) {
    selectSearchResult(item);
    router.back();
  }

  return (
    <View style={{ flex: 1, paddingTop: inset.top }} className="bg-white">
      <View className="h-[60px] pt-2">
        <View className="flex-row gap-3 px-3 py-1.5">
          <View className="flex-1 flex-row items-center gap-3 rounded-xl bg-grey-02 px-3 py-2.5">
            <TouchableOpacity onPress={router.back} hitSlop={8}>
              <ArrowLeftIcon className="text-grey-80" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="명지도 검색"
              placeholderTextColor="#AEB2B6"
              returnKeyType="search"
              multiline={false}
              onSubmitEditing={() => runSearch(query)}
              style={{ flex: 1, padding: 0, lineHeight: undefined }}
              className="text-black outline-none text-body05"
            />
            {query ? (
              <TouchableOpacity onPress={onClearQueryPress} hitSlop={8}>
                <XIcon size={16} className="text-grey-30" />
              </TouchableOpacity>
            ) : (
              <SearchIcon size={20} className="text-grey-30" />
            )}
          </View>
        </View>
      </View>

      {!trimmedQuery ? (
        <RecentSearches
          recentSearches={recentSearches}
          onClear={() => setRecentSearches([])}
          onPress={runSearch}
          onDelete={(keyword) =>
            setRecentSearches((prev) => prev.filter((recent) => recent !== keyword))
          }
        />
      ) : isEditing ? (
        <SuggestionList
          query={trimmedQuery}
          suggestions={suggestionsQuery.data ?? []}
          isPending={debouncedQuery !== trimmedQuery || suggestionsQuery.isPending}
          isError={suggestionsQuery.isError}
          onPress={(suggestion) => runSearch(suggestion.name)}
        />
      ) : (
        <SearchResultList
          query={submittedKeyword}
          results={searchResults}
          bottomPadding={inset.bottom}
          isPending={searchQuery.isPending}
          isError={searchQuery.isError}
          isFetchingNextPage={searchQuery.isFetchingNextPage}
          hasNextPage={searchQuery.hasNextPage}
          onEndReached={() => {
            if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
              void searchQuery.fetchNextPage();
            }
          }}
          onRetry={() => void searchQuery.refetch()}
          onPress={onSearchResultPress}
        />
      )}
    </View>
  );
}

// 최근 검색어
function RecentSearches({
  recentSearches,
  onClear,
  onPress,
  onDelete,
}: {
  recentSearches: string[];
  onClear: () => void;
  onPress: (keyword: string) => void;
  onDelete: (keyword: string) => void;
}) {
  return (
    <View className="mt-8 gap-2.5">
      <View className="flex-row items-end justify-between px-4">
        <Text className="text-black text-body02">최근 검색어</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={6}>
            <Text className="text-grey-60 text-caption02">전체 삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentSearches.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {recentSearches.map((keyword) => (
            <TouchableOpacity
              key={keyword}
              className="flex-row rounded-full border border-grey-10 bg-white"
              onPress={() => onPress(keyword)}
              hitSlop={4}
            >
              <Text className="my-1.5 me-[3px] ms-3 text-grey-60 text-body05">{keyword}</Text>
              <TouchableOpacity onPress={() => onDelete(keyword)} hitSlop={4}>
                <XIcon size={12} className="my-[10.5px] me-[11px] ms-[3px] text-grey-20" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text className="px-4 text-grey-40 text-body05">최근 검색어가 없습니다.</Text>
      )}
    </View>
  );
}

function SuggestionList({
  query,
  suggestions,
  isPending,
  isError,
  onPress,
}: {
  query: string;
  suggestions: MapSearchSuggestion[];
  isPending: boolean;
  isError: boolean;
  onPress: (suggestion: MapSearchSuggestion) => void;
}) {
  if (isPending) {
    return <LoadingState />;
  }

  if (isError) {
    return <MessageState message="검색어 제안을 불러올 수 없습니다." />;
  }

  if (suggestions.length === 0) {
    return (
      <MessageState
        message={`'${query}'에 대한 제안이 없습니다.`}
        description="키보드의 검색 버튼을 눌러 전체 결과를 확인해보세요."
      />
    );
  }

  return (
    <FlatList
      className="flex-1"
      data={suggestions}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => `${item.type}:${item.id}`}
      renderItem={({ item }) => {
        const Icon = getMapIcon(item.iconKey, item.categoryCode);
        return (
          <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
            <View className="flex-row items-center gap-3 px-4 py-3">
              <View className="rounded-lg bg-blue-05 p-2">
                <Icon size={20} className={getMapIconClassName(item.categoryCode)} />
              </View>
              <Text className="min-w-0 flex-1 text-black text-body04" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-grey-40 text-caption02">
                {item.type === 'BUILDING' ? '건물' : '장소'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function SearchResultList({
  query,
  results,
  bottomPadding,
  isPending,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
  onRetry,
  onPress,
}: {
  query: string;
  results: MapSearchItem[];
  bottomPadding: number;
  isPending: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onEndReached: () => void;
  onRetry: () => void;
  onPress: (item: MapSearchItem) => void;
}) {
  if (isPending) return <LoadingState />;

  if (isError) {
    return (
      <View className="items-center gap-3 px-4 pt-8">
        <Text className="text-grey-60 text-body05">검색 결과를 불러올 수 없습니다.</Text>
        <TouchableOpacity onPress={onRetry} className="rounded-lg bg-blue-05 px-4 py-2">
          <Text className="text-blue-35 text-body05">다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <MessageState
        message={`'${query}'을(를) 찾을 수 없습니다.`}
        description="장소명, 건물명, 카테고리로 다시 검색해보세요."
      />
    );
  }

  return (
    <FlatList
      className="flex-1"
      data={results}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => `${item.type}:${item.id}`}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPadding + 16 }}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <SearchResultItem item={item} onPress={() => onPress(item)} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-4">
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}

function SearchResultItem({ item, onPress }: { item: MapSearchItem; onPress: () => void }) {
  const Icon = getMapIcon(item.iconKey, item.categoryCode);
  const subtitle = item.classroomCode || item.location;

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="bg-grey-05 h-[60px] w-[60px] rounded-lg"
          />
        ) : (
          <View className="h-[60px] w-[60px] items-center justify-center rounded-lg bg-blue-05">
            <Icon size={28} className={getMapIconClassName(item.categoryCode)} />
          </View>
        )}

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <View className="rounded bg-blue-05 p-1">
              <Icon size={16} className={getMapIconClassName(item.categoryCode)} />
            </View>
            <Text className="flex-1 text-black text-body02" numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {item.operatingStatus && (
              <Text
                className={cn(
                  'font-medium text-caption02',
                  getOperatingStatusClassName(item.operatingStatus)
                )}
                numberOfLines={1}
              >
                {item.operatingStatus}
              </Text>
            )}
            {item.operatingStatus && subtitle && <View className="h-2.5 w-px bg-grey-10" />}
            {subtitle && (
              <Text className="min-w-0 flex-1 text-grey-40 text-caption02" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
            {item.distanceMeters != null && (
              <Text className="text-grey-40 text-caption02">
                {formatMapDistance(item.distanceMeters)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LoadingState() {
  return (
    <View className="items-center py-8">
      <ActivityIndicator />
    </View>
  );
}

function MessageState({ message, description }: { message: string; description?: string }) {
  return (
    <View className="px-4 pt-6">
      <View className="rounded-xl bg-grey-02 px-4 py-5">
        <Text className="text-grey-80 text-body05">{message}</Text>
        {description && <Text className="mt-1 text-grey-40 text-caption02">{description}</Text>}
      </View>
    </View>
  );
}
