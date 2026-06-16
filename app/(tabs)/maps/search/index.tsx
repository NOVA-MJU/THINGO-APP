import { ArrowLeftIcon, LocationIcon, XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OperatingStatus = '운영중' | '운영종료' | '준비중';

interface SearchResult {
  id: string;
  name: string;
  status: OperatingStatus;
  location: string;
  distance: string;
  imageUrl: string;
}

const STATUS_COLOR: Record<OperatingStatus, string> = {
  운영중: 'text-green-500',
  운영종료: 'text-red-400',
  준비중: 'text-yellow-500',
};

export default function MapsSearchScreen() {
  const inset = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = React.useRef<TextInput>(null);
  const [query, setQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState(DUMMY_RECENT_SEARCHES);

  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  function onClearRecentSearchHistoryPress() {
    setRecentSearches([]);
  }

  function onRecentSearchPress(keyword: string) {
    setQuery(keyword);
  }

  function onDeleteRecentSearchPress(keyword: string) {
    setRecentSearches((prev) => prev.filter((k) => k !== keyword));
  }

  return (
    <View style={{ flex: 1, paddingTop: inset.top }}>
      <View className="h-[60px] pt-2">
        {/* 검색바 행 */}
        <View className="flex-row gap-3 px-3 py-1.5">
          <View className="flex-1 flex-row items-center gap-3 rounded-xl bg-grey-02 p-3">
            <TouchableOpacity onPress={router.back} hitSlop={8}>
              <ArrowLeftIcon className="text-grey-80" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="명지도 검색"
              placeholderTextColor="#9ca3af"
              returnKeyType="search"
              multiline={false}
              style={{ flex: 1, padding: 0, lineHeight: undefined }}
              className="font-pretendard text-black outline-none"
            />
          </View>
        </View>
      </View>

      {query.trim() ? (
        /* 검색 결과 */
        <ScrollView contentContainerStyle={{ paddingBottom: inset.bottom }}>
          {DUMMY_RESULTS.map((item) => (
            <SearchResultItem key={item.id} item={item} />
          ))}
        </ScrollView>
      ) : (
        /* 최근 검색어 */
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
                  <Text className="my-1.5 me-[3px] ms-3 text-body05 text-grey-40">{keyword}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteRecentSearchPress(keyword)}>
                  <XIcon size={12} className="my-[10.5px] me-[11px] ms-[3px] text-grey-20" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function SearchResultItem({ item }: { item: SearchResult }) {
  return (
    <TouchableOpacity activeOpacity={0.7}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        {/* 이미지 */}
        <Image
          source={{ uri: item.imageUrl }}
          className="bg-grey-05 h-[60px] w-[60px] rounded-lg"
        />

        {/* 텍스트 영역 */}
        <View className="flex-1 gap-1">
          {/* 장소명 */}
          <View className="flex-row items-center gap-1.5">
            <LocationIcon size={14} className="text-grey-40" />
            <Text className="text-body02 font-semibold text-black">{item.name}</Text>
          </View>

          {/* 운영 상태 + 위치 + 거리 */}
          <View className="flex-row items-center gap-2">
            <Text className={`text-caption02 font-medium ${STATUS_COLOR[item.status]}`}>
              {item.status}
            </Text>
            <View className="h-2.5 w-px bg-grey-10" />
            <Text className="flex-1 text-caption02 text-grey-40" numberOfLines={1}>
              {item.location}
            </Text>
            <Text className="text-caption02 text-grey-40">{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const DUMMY_RECENT_SEARCHES = ['인문대학', '도서관', '학생회관', '공학관'];

const DUMMY_RESULTS: SearchResult[] = [
  {
    id: '1',
    name: '학생식당',
    status: '운영중',
    location: '학생회관 1층',
    distance: '120m',
    imageUrl: 'https://picsum.photos/seed/1/120/120',
  },
  {
    id: '2',
    name: '교직원식당',
    status: '운영종료',
    location: '학생회관 2층',
    distance: '125m',
    imageUrl: 'https://picsum.photos/seed/2/120/120',
  },
  {
    id: '3',
    name: '카페 온',
    status: '운영중',
    location: '인문대학 1층',
    distance: '340m',
    imageUrl: 'https://picsum.photos/seed/3/120/120',
  },
  {
    id: '4',
    name: '편의점 CU',
    status: '운영중',
    location: '공학관 지하 1층',
    distance: '510m',
    imageUrl: 'https://picsum.photos/seed/4/120/120',
  },
  {
    id: '5',
    name: '도서관 카페',
    status: '준비중',
    location: '중앙도서관 1층',
    distance: '680m',
    imageUrl: 'https://picsum.photos/seed/5/120/120',
  },
  {
    id: '6',
    name: '스타벅스',
    status: '운영중',
    location: '본관 1층',
    distance: '210m',
    imageUrl: 'https://picsum.photos/seed/6/120/120',
  },
  {
    id: '7',
    name: '복사실',
    status: '운영중',
    location: '사회과학대학 지하 1층',
    distance: '290m',
    imageUrl: 'https://picsum.photos/seed/7/120/120',
  },
  {
    id: '8',
    name: '헬스장',
    status: '운영중',
    location: '체육관 2층',
    distance: '430m',
    imageUrl: 'https://picsum.photos/seed/8/120/120',
  },
  {
    id: '9',
    name: '우체국',
    status: '운영종료',
    location: '행정관 1층',
    distance: '370m',
    imageUrl: 'https://picsum.photos/seed/9/120/120',
  },
  {
    id: '10',
    name: '은행 ATM',
    status: '운영중',
    location: '학생회관 지하 1층',
    distance: '130m',
    imageUrl: 'https://picsum.photos/seed/10/120/120',
  },
  {
    id: '11',
    name: '문구점',
    status: '운영중',
    location: '공학관 1층',
    distance: '490m',
    imageUrl: 'https://picsum.photos/seed/11/120/120',
  },
  {
    id: '12',
    name: '약국',
    status: '운영중',
    location: '후문 앞',
    distance: '760m',
    imageUrl: 'https://picsum.photos/seed/12/120/120',
  },
  {
    id: '13',
    name: '세탁소',
    status: '준비중',
    location: '기숙사 1층',
    distance: '820m',
    imageUrl: 'https://picsum.photos/seed/13/120/120',
  },
  {
    id: '14',
    name: '인쇄실',
    status: '운영중',
    location: '도서관 3층',
    distance: '650m',
    imageUrl: 'https://picsum.photos/seed/14/120/120',
  },
  {
    id: '15',
    name: '동아리방',
    status: '운영중',
    location: '학생회관 3층',
    distance: '140m',
    imageUrl: 'https://picsum.photos/seed/15/120/120',
  },
  {
    id: '16',
    name: '푸드코트',
    status: '운영종료',
    location: '학생회관 지하 1층',
    distance: '135m',
    imageUrl: 'https://picsum.photos/seed/16/120/120',
  },
  {
    id: '17',
    name: '세미나실',
    status: '준비중',
    location: '경영대학 4층',
    distance: '580m',
    imageUrl: 'https://picsum.photos/seed/17/120/120',
  },
  {
    id: '18',
    name: '자전거 보관소',
    status: '운영중',
    location: '정문 옆',
    distance: '950m',
    imageUrl: 'https://picsum.photos/seed/18/120/120',
  },
  {
    id: '19',
    name: '매점',
    status: '운영중',
    location: '예술대학 1층',
    distance: '720m',
    imageUrl: 'https://picsum.photos/seed/19/120/120',
  },
  {
    id: '20',
    name: '휴게실',
    status: '운영중',
    location: '자연과학대학 2층',
    distance: '410m',
    imageUrl: 'https://picsum.photos/seed/20/120/120',
  },
];
