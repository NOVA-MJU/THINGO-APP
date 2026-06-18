import { ArrowLeftIcon, SearchIcon, XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  searchMyeongjiPlaces,
  type MapSearchResult,
  type MapSearchResponse,
} from '@/lib/maps/search';
import { findPlaceById, type OperatingStatus } from '@/lib/maps/places';

const STATUS_COLOR: Record<OperatingStatus, string> = {
  '곧 운영 시작': 'text-blue-35',
  운영중: 'text-[#34AA6F]',
  '곧 운영 종료': 'text-[#EDAE26]',
  '운영 종료': 'text-error',
  '24시간 운영': 'text-blue-35',
  휴무: 'text-grey-40',
};

const DUMMY_RECENT_SEARCHES = ['학생회관', '도서관', '프린터', '은행 ATM'];

export default function MapsSearchScreen() {
  const inset = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState(DUMMY_RECENT_SEARCHES);

  const trimmedQuery = query.trim();
  const searchResponse = React.useMemo(
    () => (trimmedQuery ? searchMyeongjiPlaces(trimmedQuery) : null),
    [trimmedQuery]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  function addRecentSearch(keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    setRecentSearches((prev) => [
      trimmedKeyword,
      ...prev.filter((recentKeyword) => recentKeyword !== trimmedKeyword),
    ]);
  }

  function onClearRecentSearchHistoryPress() {
    setRecentSearches([]);
  }

  function onRecentSearchPress(keyword: string) {
    setQuery(keyword);
  }

  function onDeleteRecentSearchPress(keyword: string) {
    setRecentSearches((prev) => prev.filter((k) => k !== keyword));
  }

  function onClearQueryPress() {
    setQuery('');
    inputRef.current?.focus();
  }

  function navigateToPlace(place: MapSearchResult) {
    if (place.isBuilding) {
      router.navigate({ pathname: '/maps', params: { placeId: place.id } });
      return;
    }

    router.navigate({
      pathname: '/maps',
      params: {
        placeId: place.parentBuildingInfo?.buildingId ?? place.id,
        facilityId: place.id,
        expanded: 'true',
      },
    });
  }

  function onSubmitSearch() {
    addRecentSearch(trimmedQuery);
    const routingTarget = searchResponse?.searchMetadata.routingTarget;
    if (!searchResponse?.searchMetadata.exactMatch || !routingTarget) return;

    router.navigate({
      pathname: '/maps',
      params: {
        placeId: routingTarget.placeId,
        exactMatch: 'true',
      },
    });
  }

  function onPlacePress(place: MapSearchResult) {
    addRecentSearch(trimmedQuery || place.name);
    navigateToPlace(place);
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
              onSubmitEditing={onSubmitSearch}
              style={{ flex: 1, padding: 0, lineHeight: undefined }}
              className="text-body05 text-black outline-none"
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

      {trimmedQuery ? (
        <SearchResultList
          query={trimmedQuery}
          searchResponse={searchResponse}
          onPlacePress={onPlacePress}
          bottomPadding={inset.bottom}
        />
      ) : (
        <RecentSearches
          recentSearches={recentSearches}
          onClearRecentSearchHistoryPress={onClearRecentSearchHistoryPress}
          onRecentSearchPress={onRecentSearchPress}
          onDeleteRecentSearchPress={onDeleteRecentSearchPress}
        />
      )}
    </View>
  );
}

function RecentSearches({
  recentSearches,
  onClearRecentSearchHistoryPress,
  onRecentSearchPress,
  onDeleteRecentSearchPress,
}: {
  recentSearches: string[];
  onClearRecentSearchHistoryPress: () => void;
  onRecentSearchPress: (keyword: string) => void;
  onDeleteRecentSearchPress: (keyword: string) => void;
}) {
  return (
    <View className="mt-8 gap-2.5">
      <View className="flex-row items-end justify-between px-4">
        <Text className="text-body02 text-black">최근 검색어</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={onClearRecentSearchHistoryPress} hitSlop={6}>
            <Text className="text-caption02 text-grey-60">전체 삭제</Text>
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
            <View key={keyword} className="flex-row rounded-full border border-grey-10 bg-white">
              <TouchableOpacity onPress={() => onRecentSearchPress(keyword)}>
                <Text className="my-1.5 me-[3px] ms-3 text-body05 text-grey-60">{keyword}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteRecentSearchPress(keyword)} hitSlop={4}>
                <XIcon size={12} className="my-[10.5px] me-[11px] ms-[3px] text-grey-20" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text className="px-4 text-body05 text-grey-40">최근 검색어가 없습니다.</Text>
      )}
    </View>
  );
}

function SearchResultList({
  query,
  searchResponse,
  onPlacePress,
  bottomPadding,
}: {
  query: string;
  searchResponse: MapSearchResponse | null;
  onPlacePress: (place: MapSearchResult) => void;
  bottomPadding: number;
}) {
  const results = searchResponse?.searchResults ?? [];
  const directTargetPlace = findPlaceById(searchResponse?.searchMetadata.routingTarget?.placeId);

  if (searchResponse?.searchMetadata.exactMatch && directTargetPlace) {
    return (
      <View className="px-4 pt-6">
        <View className="rounded-xl bg-blue-02 px-4 py-5">
          <Text className="text-body04 text-blue-35">{directTargetPlace.name}</Text>
          <Text className="mt-1 text-body05 text-grey-80">
            엔터를 누르면 지도에서 건물 요약을 바로 볼 수 있어요.
          </Text>
        </View>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View className="px-4 pt-6">
        <View className="rounded-xl bg-grey-02 px-4 py-5">
          <Text className="text-body05 text-grey-80">{`'${query}'을(를) 찾을 수 없습니다.`}</Text>
          <Text className="mt-1 text-caption02 text-grey-40">
            장소명, 건물명, 카테고리로 다시 검색해보세요.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding + 16 }}>
      <View className="py-2">
        {results.map((item) => (
          <SearchResultItem key={item.id} item={item} onPress={() => onPlacePress(item)} />
        ))}
      </View>
    </ScrollView>
  );
}

function SearchResultItem({ item, onPress }: { item: MapSearchResult; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Image
          source={{ uri: item.imageUrl ?? `https://picsum.photos/seed/${item.id}/120/120` }}
          className="bg-grey-05 h-[60px] w-[60px] rounded-lg"
        />

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <View className="rounded bg-blue-05 p-1">
              <item.Icon size={16} className={item.iconClassName} />
            </View>
            <Text className="flex-1 text-body02 text-black" numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className={cn('text-caption02 font-medium', STATUS_COLOR[item.status])}>
              {item.status}
            </Text>
            <View className="h-2.5 w-px bg-grey-10" />
            <Text className="min-w-0 flex-1 text-caption02 text-grey-40" numberOfLines={1}>
              {item.location}
            </Text>
            <Text className="text-caption02 text-grey-40">{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
