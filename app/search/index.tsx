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
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import { Link, router } from 'expo-router';
import * as React from 'react';
import { Image, FlatList, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['ALL', '게시판', '공지사항', '학사일정', '명대신문', '명대뉴스'];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = React.useState(TABS[0]);
  const [query, setQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState(RECENT_SEARCHES);

  function onClearRecentSearchHistoryPress(): void {
    setRecentSearches([]);
  }

  function onRecentSearchPress(keyword: string): void {
    setQuery(keyword);
  }

  function onDeleteRecentSearchPress(keyword: string): void {
    setRecentSearches((prev) => prev.filter((k) => k !== keyword));
  }

  function onSuggestedSearchPress(keyword: string): void {
    setQuery(keyword);
  }

  function onPopularSearchPress(keyword: string): void {
    setQuery(keyword);
  }

  function onNoticeMorePress(): void {}

  function onCommunityMorePress(): void {}

  function onNewspaperMorePress(): void {}

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
        {!query && (
          <View>
            {/* 최근 검색어 */}
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
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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

            {/* 추천 검색어 */}
            <View className="mt-8 gap-2.5">
              <Text className="ms-4 text-body02 text-black">추천 검색어</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {SUGGESTED_SEARCHES.map((keyword) => (
                  <TouchableOpacity key={keyword} onPress={() => onSuggestedSearchPress(keyword)}>
                    <View className="rounded-full bg-blue-05 px-3 py-1.5">
                      <Text className="text-body05 text-blue-35">{keyword}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 인기 검색어 */}
            <View className="mt-8 gap-3">
              <Text className="ms-4 text-body02 text-black">인기 검색어</Text>
              <FlatList
                data={POPULAR_SEARCHES}
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

        {/* 검색어 있는 경우 */}
        {!!query && (
          <View>
            <TabBar
              tabs={TABS}
              currentTab={currentTab}
              onTabPress={(i) => setCurrentTab(TABS[i])}
            />

            {/* ai 요약 검색 결과 */}
            <View className="gap-3.5 px-4 py-5">
              <Text className="text-body02 text-black">
                <Text className="text-mju-primary">AI</Text> 요약 검색 결과
              </Text>
              <Text className="text-body05 text-grey-80">{AI_SUMMARY}</Text>
              <View>
                {AI_SOURCES.map((source) => (
                  <View
                    key={source.id}
                    className="flex-row items-center gap-1 border-b border-grey-02 py-1">
                    <Text className="flex-1 text-body05 text-grey-30">{source.title}</Text>
                    <Link href={source.url as `https://${string}`} asChild>
                      <TouchableOpacity>
                        <LinkIcon />
                      </TouchableOpacity>
                    </Link>
                  </View>
                ))}
              </View>
            </View>
            <View className="h-2 w-full bg-grey-02" />

            {/* 공지사항 검색 결과*/}
            <View className="py-5">
              <View className="flex-row items-center justify-between px-4">
                <Text className="text-body02 text-black">공지사항</Text>
                <TouchableOpacity onPress={() => onNoticeMorePress()}>
                  <ArrowRightIcon size={20} className="text-grey-60" />
                </TouchableOpacity>
              </View>
              {NOTICE_RESULTS.map((item) => (
                <Link key={item.id} href={item.url as `https://${string}`} asChild>
                  <TouchableOpacity>
                    <View className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                      <Text className="text-caption01 text-blue-15">{item.category}</Text>
                      <Text className="text-body05 text-black" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text className="text-caption04 text-grey-30">{item.date}</Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>

            {/* 커뮤니티 검색 결과*/}
            <View className="py-5">
              <View className="flex-row items-center justify-between px-4">
                <Text className="text-body02 text-black">커뮤니티</Text>
                <TouchableOpacity onPress={() => onCommunityMorePress()}>
                  <ArrowRightIcon size={20} className="text-grey-60" />
                </TouchableOpacity>
              </View>
              {COMMUNITY_RESULTS.map((item) => (
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
                          <Text className="ms-1 text-caption02 text-grey-40">{item.comments}</Text>
                        </View>
                        <Text className="text-caption02 text-grey-40">{item.date}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>

            {/* 명대신문 검색 결과*/}
            <View className="py-5">
              <View className="flex-row items-center justify-between px-4">
                <Text className="text-body02 text-black">명대신문</Text>
                <TouchableOpacity onPress={() => onNewspaperMorePress()}>
                  <ArrowRightIcon size={20} className="text-grey-60" />
                </TouchableOpacity>
              </View>
              {/*  */}
              <View className="mt-2">
                {NEWSPAPER_RESULTS.map((item) => (
                  <Link key={item.id} href={item.url as `https://${string}`} asChild>
                    <TouchableOpacity>
                      <View className="flex-row items-center gap-4 px-4 py-3">
                        <Image
                          source={require('@/assets/news-default-thumbnail.jpg')}
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
                            {item.date}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const RECENT_SEARCHES = [
  '수강신청',
  '장학금 신청',
  '도서관 열람실',
  '학식 메뉴',
  '졸업 요건',
  '소프트웨어 라이선스',
];

const SUGGESTED_SEARCHES = [
  '수강신청 일정',
  '장학금 종류',
  '학식 오늘',
  '도서관 좌석',
  '졸업논문 제출',
  '학생증 발급',
  '버스 시간표',
  '교내 동아리',
];

const POPULAR_SEARCHES = [
  '수강신청',
  '장학금',
  '도서관 좌석',
  '학식 메뉴',
  '졸업 요건',
  '학생증 발급',
];

const AI_SUMMARY =
  '명지대학교 2025학년도 1학기 수강신청은 2월 17일(월)부터 21일(금)까지 진행됩니다. 재학생은 학년별로 신청 기간이 나뉘며, 포털 시스템(mjportal.mju.ac.kr)에서 신청할 수 있습니다. 수강 정원 초과 시 대기 신청이 가능하며, 개강 후 2주 이내에 수강 변경 기간이 별도로 운영됩니다. 장학금·학점 등 조건에 따라 신청 가능 학점 수가 달라지므로 학생처 공지사항을 반드시 확인하세요.';

const AI_SOURCES: { id: number; title: string; url: string }[] = [
  {
    id: 1,
    title: '[학사공지] 2025학년도 1학기 수강신청 일정 안내',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do',
  },
  {
    id: 2,
    title: '[학사공지] 수강신청 유의사항 및 정원 초과 대기 방법',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do',
  },
  {
    id: 3,
    title: '[장학처] 성적 기준 장학금 신청 가능 학점 안내',
    url: 'https://www.mju.ac.kr/mjukr/259/subview.do',
  },
  {
    id: 4,
    title: '[학사공지] 개강 후 수강 변경 기간 운영 안내',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do',
  },
];

const NOTICE_RESULTS: { id: number; category: string; title: string; date: string; url: string }[] =
  [
    {
      id: 1,
      category: '학사공지',
      title:
        '2025학년도 1학기 수강신청 일정 및 유의사항 안내 — 신청 기간·정원 초과 대기 방법·수강 변경 기간 포함',
      date: '2025.01.15',
      url: 'https://www.mju.ac.kr/mjukr/255/subview.do',
    },
    {
      id: 2,
      category: '장학공지',
      title:
        '2025학년도 1학기 국가장학금(한국장학재단) 신청 안내 — 소득분위 산정 기준 및 제출 서류 목록 포함 (1차 신청)',
      date: '2025.01.10',
      url: 'https://www.mju.ac.kr/mjukr/259/subview.do',
    },
    {
      id: 3,
      category: '학사공지',
      title: '개강 후 수강 변경(정정) 기간 운영 안내 — 변경 가능 과목 범위 및 포털 신청 방법 안내',
      date: '2025.01.08',
      url: 'https://www.mju.ac.kr/mjukr/255/subview.do',
    },
  ];

const COMMUNITY_RESULTS: {
  id: number;
  title: string;
  preview: string;
  likes: number;
  comments: number;
  date: string;
}[] = [
  {
    id: 1,
    title: '수강신청 꿀팁 공유합니다',
    preview:
      '저는 매번 수강신청 때 이 방법으로 성공했어요. 특히 인기 강의는 미리 즐겨찾기 해두는 게 핵심입니다.',
    likes: 42,
    comments: 18,
    date: '2025.01.14',
  },
  {
    id: 2,
    title: '1학기 장학금 신청 같이 하실 분?',
    preview:
      '국가장학금 서류 준비하다가 헷갈리는 부분 있어서 같이 스터디 하실 분 구합니다. 카톡 오픈채팅으로 연락주세요.',
    likes: 27,
    comments: 9,
    date: '2025.01.12',
  },
  {
    id: 3,
    title: '도서관 열람실 자리 잡는 타이밍',
    preview: '오전 8시 이전에 가면 거의 항상 자리 있더라고요. 시험기간에는 7시 30분도 빠듯합니다.',
    likes: 61,
    comments: 33,
    date: '2025.01.09',
  },
];

const NEWSPAPER_RESULTS: {
  id: number;
  title: string;
  preview: string;
  author: string;
  date: string;
  url: string;
}[] = [
  {
    id: 1,
    title: '2025년 명지대, 글로벌 캠퍼스 확장 추진',
    preview:
      '명지대학교가 올해 해외 자매결연 대학을 기존 120개에서 150개로 확대하는 글로벌 캠퍼스 프로젝트를 본격 추진한다고 밝혔다.',
    author: '김명지 기자',
    date: '2025.01.13',
    url: 'https://www.mju.ac.kr/mjukr/267/subview.do',
  },
  {
    id: 2,
    title: '학생 복지관 리모델링, 3월 완공 예정',
    preview:
      '노후화된 학생 복지관이 전면 리모델링을 거쳐 오는 3월 초 새롭게 문을 열 예정이다. 카페테리아와 휴게 공간이 대폭 확충된다.',
    author: '이한솔 기자',
    date: '2025.01.07',
    url: 'https://www.mju.ac.kr/mjukr/267/subview.do',
  },
  {
    id: 3,
    title: '명지대 창업동아리, 스타트업 경진대회 대상 수상',
    preview:
      '명지대학교 창업동아리 \"테크브릿지\"가 지난달 열린 전국 대학생 스타트업 경진대회에서 대상을 수상하며 주목받고 있다.',
    author: '박수현 기자',
    date: '2025.01.03',
    url: 'https://www.mju.ac.kr/mjukr/267/subview.do',
  },
];
