import { getCalendar, type CalendarData, type CalendarEvent } from '@/api/calendar';
import { getNotices, type Notice } from '@/api/notices';
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
import { cn, parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORY_LABEL: Record<string, string> = {
  general: '일반',
  academic: '학사',
  scholarship: '장학',
  career: '진로',
  activity: '학생활동',
  rule: '학칙개정',
};

// 선택된 날짜를 'MM.DD (요일)' 형식으로 변환
function formatSelectedDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dow = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}.${day} (${dow})`;
}

// 일정의 시작·종료 날짜를 'MM.DD' 또는 'MM.DD - MM.DD' 형식으로 변환
function formatEventDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => d.slice(5).replace('-', '.');
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} - ${fmt(endDate)}`;
}

const TABS = ['캘린더', '학사공지'];
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const FILTER_OPTIONS = ['전체', '학부', '대학원', '휴일'];

// 캘린더 리본 컬러 매핑
const RIBBON_COLOR: Record<string, string> = {
  all: 'bg-blue-35',
  undergrad: 'bg-blue-15',
  graduate: 'bg-blue-05',
  holiday: 'bg-grey-02',
};

type CalendarCell = { date: number; isCurrentMonth: boolean; fullDate: string };

// 주어진 연월의 캘린더 그리드(주 단위 2차원 배열)를 생성
function buildCalendarGrid(year: number, month: number): CalendarCell[][] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cells: CalendarCell[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({ date: d, isCurrentMonth: false, fullDate: fmt(prevYear, prevMonth, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, isCurrentMonth: true, fullDate: fmt(year, month, d) });
  }
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: d, isCurrentMonth: false, fullDate: fmt(nextYear, nextMonth, d) });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// 특정 날짜에 해당하는 일정 카테고리별 리본 색상 목록을 반환
function getRibbonsForDate(data: CalendarData | null, dateStr: string): string[] {
  if (!data) return [];
  const inRange = (e: CalendarEvent) => e.startDate <= dateStr && dateStr <= e.endDate;
  const ribbons: string[] = [];
  if (data.all.some(inRange)) ribbons.push(RIBBON_COLOR.all);
  if (data.undergrad.some(inRange)) ribbons.push(RIBBON_COLOR.undergrad);
  if (data.graduate.some(inRange)) ribbons.push(RIBBON_COLOR.graduate);
  if (data.holiday.some(inRange)) ribbons.push(RIBBON_COLOR.holiday);
  return ribbons;
}

type EventItem = { dateLabel: string; description: string };

// 선택된 날짜와 필터 조건에 맞는 일정 목록을 반환
function getEventsForDate(data: CalendarData | null, dateStr: string, filter: string): EventItem[] {
  if (!data) return [];
  const inRange = (e: CalendarEvent) => e.startDate <= dateStr && dateStr <= e.endDate;
  const toItem = (e: CalendarEvent): EventItem => ({
    dateLabel: formatEventDateRange(e.startDate, e.endDate),
    description: e.description,
  });

  const result: EventItem[] = [];
  // '전체', '학부', '대학원' all show joint (all) events
  if (filter !== '휴일') {
    data.all.filter(inRange).forEach((e) => result.push(toItem(e)));
  }
  if (filter === '전체' || filter === '학부') {
    data.undergrad.filter(inRange).forEach((e) => result.push(toItem(e)));
  }
  if (filter === '전체' || filter === '대학원') {
    data.graduate.filter(inRange).forEach((e) => result.push(toItem(e)));
  }
  if (filter === '전체' || filter === '휴일') {
    data.holiday.filter(inRange).forEach((e) => result.push(toItem(e)));
  }
  return result;
}

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export default function AcademicCalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tab?: string;
    year?: string;
    month?: string;
    filter?: string;
    date?: string;
    page?: string;
  }>();

  const currentTab = params.tab === 'notice' ? '학사공지' : '캘린더';
  const currentYear = Number(params.year ?? today.getFullYear());
  const currentMonth = Number(params.month ?? today.getMonth() + 1);
  const selectedFilter = FILTER_OPTIONS.includes(params.filter ?? '')
    ? (params.filter ?? '전체')
    : '전체';
  const selectedDate = params.date ?? todayStr;
  const currentPage = Number(params.page ?? '1');

  const scrollRef = React.useRef<ScrollView>(null);
  const todayDayIndex = today.getDay();
  const [calendarData, setCalendarData] = React.useState<CalendarData | null>(null);
  const [calendarLoading, setCalendarLoading] = React.useState(false);
  const [academicNotices, setAcademicNotices] = React.useState<Notice[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  // 캘린더 데이터 조회
  React.useEffect(() => {
    if (currentTab !== '캘린더') return;
    setCalendarLoading(true);
    getCalendar(currentYear, currentMonth)
      .then(setCalendarData)
      .catch(() => setCalendarData(null))
      .finally(() => setCalendarLoading(false));
  }, [currentTab, currentYear, currentMonth]);

  // 학사공지 데이터 조회
  React.useEffect(() => {
    if (currentTab !== '학사공지') return;
    setLoading(true);
    getNotices({ category: 'academic', page: currentPage - 1, size: 10 })
      .then((res) => {
        setAcademicNotices(res.content);
        setTotalPages(res.totalPages);
      })
      .catch(() => setAcademicNotices([]))
      .finally(() => setLoading(false));
  }, [currentTab, currentPage]);

  // 페이지 변경 시 화면 상단으로 스크롤
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  // 이전 달로 이동
  function handlePrevMonth(): void {
    const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const isToday = newYear === today.getFullYear() && newMonth === today.getMonth() + 1;
    const newDate = isToday ? todayStr : `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    router.setParams({ year: String(newYear), month: String(newMonth), date: newDate });
  }

  // 오늘이 속한 달로 초기화
  function handleResetMonth(): void {
    router.setParams({
      year: String(today.getFullYear()),
      month: String(today.getMonth() + 1),
      date: todayStr,
    });
  }

  // 다음 달로 이동
  function handleNextMonth(): void {
    const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const isToday = newYear === today.getFullYear() && newMonth === today.getMonth() + 1;
    const newDate = isToday ? todayStr : `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    router.setParams({ year: String(newYear), month: String(newMonth), date: newDate });
  }

  const calendarGrid = React.useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const scheduleEvents = selectedDate
    ? getEventsForDate(calendarData, selectedDate, selectedFilter)
    : [];

  return (
    <ScrollView ref={scrollRef} className="native:w-screen web:w-full">
      {/* 탭 네비게이션 */}
      <View className="bg-grey-02">
        <View className="mt-2 flex-row">
          {TABS.map((label, index) => (
            <Pressable
              key={index}
              onPress={() => {
                router.setParams({ tab: label === '학사공지' ? 'notice' : 'calendar', page: '1' });
              }}
              className={cn(
                'flex-1 border py-2',
                currentTab === label
                  ? 'rounded-t-sm border-grey-10 border-b-white bg-white'
                  : 'border-grey-02 border-b-grey-10'
              )}
            >
              <Text
                className={cn(
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
                    className={cn(
                      'flex-1 rounded',
                      isCurrentMonth && index === todayDayIndex ? 'bg-blue-15' : 'bg-grey-02'
                    )}
                  >
                    <Text
                      className={cn(
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
                {calendarGrid.map((week, wi) => (
                  <View key={wi} className="flex-row">
                    {week.map((cell, di) => {
                      const ribbons = getRibbonsForDate(calendarData, cell.fullDate);
                      return (
                        <TouchableOpacity
                          key={di}
                          className="h-[60px] flex-1 gap-1 py-1"
                          onPress={() => router.setParams({ date: cell.fullDate })}
                        >
                          <Text
                            className={cn(
                              'ms-1.5 text-caption04',
                              !cell.isCurrentMonth
                                ? 'text-grey-10'
                                : di === 0
                                  ? 'text-error'
                                  : 'text-black'
                            )}
                          >
                            {cell.date}
                          </Text>
                          {ribbons.map((color, ri) => (
                            <View key={ri} className={cn('h-1 w-full', color)} />
                          ))}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {calendarLoading && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator />
                </View>
              )}
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
              <Text className="text-body02 text-mju-primary">
                {selectedDate ? formatSelectedDate(selectedDate) : '날짜를 선택하세요'}
              </Text>
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
                      onPress={() => router.setParams({ filter: option })}
                      className={cn(selectedFilter === option && 'bg-blue-05')}
                    >
                      <Text
                        className={cn(
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
              {scheduleEvents.length === 0 && selectedDate && (
                <Text className="px-5 py-2 text-caption02 text-grey-30">일정이 없습니다.</Text>
              )}
              {scheduleEvents.map((item, index) => (
                <View key={index} className="flex-row items-start gap-2 px-5 py-2">
                  <Text className="w-[80px] text-caption02 text-grey-40">{item.dateLabel}</Text>
                  <Text className="flex-1 text-caption02 text-black" numberOfLines={2}>
                    {item.description}
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
          <View className="relative flex-1 py-3">
            {academicNotices.map((item, index) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(item.link)}>
                <View className="gap-[3px] border-b border-grey-02 px-4 py-2.5">
                  <Text className="text-caption01 text-blue-15" numberOfLines={1}>
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </Text>
                  <Text className="text-body05 text-black" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-caption04 text-grey-30" numberOfLines={1}>
                    {format(parseUTCDate(item.date), 'yyyy.MM.dd')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {loading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator />
              </View>
            )}
          </View>

          {/* 페이지네이션 */}
          <View className="pb-9 pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => router.setParams({ page: String(p) })}
            />
          </View>
        </View>
      )}

      <Footer />
    </ScrollView>
  );
}
