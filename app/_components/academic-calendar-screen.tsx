import { Footer } from '@/components/footer';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { clsx } from 'clsx';
import * as React from 'react';
import { Linking, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = ['캘린더', '학사공지'];
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const FILTER_OPTIONS = ['전체', '학부', '대학원', '휴일'];

type CalendarCell = { date: number; isCurrentMonth: boolean };

function buildCalendarGrid(year: number, month: number): CalendarCell[][] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ date: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, isCurrentMonth: true });
  }
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: d, isCurrentMonth: false });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export default function AcademicCalendarScreen() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = React.useState('캘린더');

  const today = new Date();
  const todayDayIndex = today.getDay();
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth() + 1);
  const [selectedFilter, setSelectedFilter] = React.useState('전체');
  const [currentPage, setCurrentPage] = React.useState(1);
  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  function handlePrevMonth(): void {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleResetMonth(): void {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  }

  function handleNextMonth(): void {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  return (
    <ScrollView
      className="w-screen"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
    >
      {/* 탭 네비게이션 */}
      <View className="bg-grey-02">
        <View className="mt-2 flex-row">
          {TABS.map((label, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentTab(label)}
              className={clsx(
                'flex-1 py-2',
                currentTab === label
                  ? 'rounded-t-sm border-e border-s border-t border-grey-10 bg-white'
                  : 'border-b border-grey-10'
              )}
            >
              <Text
                className={clsx(
                  'text-center',
                  currentTab === label ? 'text-body04 text-black' : 'text-body05 text-grey-40'
                )}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 본문 */}
      {currentTab === '캘린더' && (
        <View className="flex-1 py-3">
          <View className="px-5">
            {/* 캘린더 */}
            <View className="gap-4 rounded border border-grey-02 px-[7px] py-3">
              {/* 현재날짜 */}
              <View className="flex-row items-center justify-center gap-2">
                <TouchableOpacity onPress={() => handlePrevMonth()}>
                  <View className="p-0.5">
                    <ArrowLeftIcon size={20} className="text-grey-40" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleResetMonth()}>
                  <Text className="text-body02 text-black">
                    {currentYear}년 {currentMonth}월
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleNextMonth()}>
                  <View className="p-0.5">
                    <ArrowRightIcon size={20} className="text-grey-40" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* 요일판 */}
              <View className="flex-row items-center gap-1">
                {DAYS.map((day, index) => (
                  <View
                    key={day}
                    className={clsx(
                      'flex-1 rounded',
                      isCurrentMonth && index === todayDayIndex ? 'bg-blue-15' : 'bg-grey-02'
                    )}
                  >
                    <Text
                      className={clsx(
                        'text-center text-caption03',
                        isCurrentMonth && index === todayDayIndex ? 'text-white' : 'text-grey-30'
                      )}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 날짜판 */}
              <View className="gap-0.5">
                {buildCalendarGrid(currentYear, currentMonth).map((week, wi) => (
                  <View key={wi} className="flex-row gap-1">
                    {week.map((cell, di) => (
                      <View key={di} className="h-[60px] flex-1 p-1">
                        <Text
                          className={clsx(
                            'text-caption04',
                            !cell.isCurrentMonth
                              ? 'text-grey-10'
                              : di === 0
                                ? 'text-error'
                                : 'text-black'
                          )}
                        >
                          {cell.date}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 범례 */}
          <View className="mt-3 flex-row items-center justify-end px-5">
            <View className="h-2.5 w-2.5 bg-blue-35" />
            <Text className="ms-1 text-caption04 text-grey-40">전체 (학부·대학원)</Text>
            <View className="ms-4 h-2.5 w-2.5 bg-blue-15" />
            <Text className="ms-1 text-caption04 text-grey-40">학부</Text>
            <View className="ms-4 h-2.5 w-2.5 bg-blue-05" />
            <Text className="ms-1 text-caption04 text-grey-40">대학원</Text>
            <View className="ms-4 h-2.5 w-2.5 bg-grey-02" />
            <Text className="ms-1 text-caption04 text-grey-40">휴일</Text>
          </View>

          {/* 세부일정 */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between border-b border-grey-02 py-1 pe-[14px] ps-5">
              <Text className="text-body02 text-mju-primary">01.21 (화)</Text>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TouchableOpacity>
                    <View className="flex-row items-center gap-1 p-1">
                      <Text className="text-caption02 text-grey-30">{selectedFilter}</Text>
                      <ArrowDownIcon size={16} className="text-grey-30" />
                    </View>
                  </TouchableOpacity>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {FILTER_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onPress={() => setSelectedFilter(option)}
                      className={clsx(selectedFilter === option && 'bg-blue-05')}
                    >
                      <Text
                        className={clsx(
                          'text-caption02',
                          selectedFilter === option ? 'text-blue-35' : 'text-grey-30'
                        )}
                      >
                        {option}
                      </Text>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>
            <View className="pb-3 pt-2">
              {SCHEDULE_DUMMY_DATA.items.map((item, index) => (
                <View key={index} className="flex-row items-start gap-2 px-5 py-2">
                  <Text className="w-[75px] text-caption02 text-grey-40">{item.date}</Text>
                  <Text className="flex-1 text-caption02 text-black" numberOfLines={2}>
                    <Text className="text-caption02 font-bold">{item.category}</Text> {item.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {currentTab === '학사공지' && (
        <View className="flex-1">
          {/* 학사공지 목록 */}
          <View className="flex-1 py-3">
            {NOTICE_DUMMY_DATA.map((item, index) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(item.url)}>
                <View className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                  <Text className="text-caption01 text-blue-15" numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Text className="text-body05 text-black" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {item.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 페이지네이션 */}
          <View className="pb-9 pt-6">
            <Pagination currentPage={currentPage} totalPages={7} onPageChange={setCurrentPage} />
          </View>
        </View>
      )}

      <Footer />
    </ScrollView>
  );
}

const NOTICE_DUMMY_DATA = [
  {
    category: '일반',
    title: '2025-2 아트앤멀티미디어음악학부 패널 뮤직전공관현악의 밤 행사 안내',
    date: '2025.08.25',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkY5JTJGMTQwMjIlMkZhcnRjbFZpZXcuZG8lM0Y%3D',
  },
  {
    category: '장학',
    title: '2025학년도 2학기 교내 성적우수장학금 신청 안내',
    date: '2025.08.20',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkY5JTJGMTQwMjMlMkZhcnRjbFZpZXcuZG8lM0Y%3D',
  },
  {
    category: '학사',
    title: '2025-2학기 수강신청 변경 기간 운영 안내',
    date: '2025.08.15',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkY5JTJGMTQwMjQlMkZhcnRjbFZpZXcuZG8lM0Y%3D',
  },
  {
    category: '취업',
    title: '2025년 하반기 캠퍼스 리크루팅 참여 기업 모집 안내',
    date: '2025.08.10',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkY5JTJGMTQwMjUlMkZhcnRjbFZpZXcuZG8lM0Y%3D',
  },
  {
    category: '행사',
    title: '2025 명지대학교 가을 축제 자원봉사자 모집 안내',
    date: '2025.08.05',
    url: 'https://www.mju.ac.kr/mjukr/255/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbWp1a3IlMkY5JTJGMTQwMjYlMkZhcnRjbFZpZXcuZG8lM0Y%3D',
  },
];

const SCHEDULE_DUMMY_DATA = {
  date: '01.21 (화)',
  items: [
    { date: '01.05', category: '[학부·대학원]', title: '학기 개시일, 2학기 개강' },
    { date: '01.05', category: '[학부·대학원]', title: '학기 개시일, 2학기 개강 학기 개시일' },
    {
      date: '01.05 - 01.09',
      category: '[학부·대학원]',
      title: '수강신청 변경 기간 수강신청 변경 기간수강신청 변경 기간수강신청 변경 기간',
    },
  ],
};
