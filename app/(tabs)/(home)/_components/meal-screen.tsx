import { getMenus, type DailyMenu } from '@/api/menus';
import { Footer } from '@/components/footer';
import {
  BreakfastMealIcon,
  DinnerMealIcon,
  LocationIcon,
  LunchMealIcon,
  UndoIcon,
} from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import MealRating from './meal-rating';
import { cleanMeals } from '@/lib/meal';

export default function MealScreen() {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [menus, setMenus] = React.useState<DailyMenu[]>([]);

  // 오늘 날짜(today)와 이번 주 평일 목록(dates) 계산 — 마운트 시 1회만 실행
  const { today, thisWeek, nextWeek } = React.useMemo(() => {
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayObj = { date: `${mm}/${dd}`, day: DAY_NAMES[now.getDay()] };

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // weekOffset 0은 이번 주, 7은 다음 주
    const weekdays = (weekOffset: number) => {
      const result: { day: string; date: string; iso: string }[] = [];
      for (let weekday = 0; weekday < 5; weekday++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + weekOffset + weekday);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        result.push({
          date: `${m}/${day}`,
          day: DAY_NAMES[d.getDay()],
          iso: `${d.getFullYear()}-${m}-${day}`,
        });
      }
      return result;
    };
    return { today: todayObj, thisWeek: weekdays(0), nextWeek: weekdays(7) };
  }, []);

  // 주말엔 오늘이 평일 목록에 없다. 학교가 주말에 다음 주 식단으로 바꿔 올리므로,
  // 다음 주 월요일 식단이 응답에 있으면 다음 주를 보여주고 아직이면 이번 주 금요일을 보여준다
  const isWeekend = !thisWeek.some((d) => d.date === today.date);
  const nextWeekReady = menus.some((m) => m.date.startsWith(nextWeek[0].date.replace('/', '.')));
  const dates = isWeekend && nextWeekReady ? nextWeek : thisWeek;
  const defaultDate = !isWeekend ? today.date : nextWeekReady ? nextWeek[0].date : thisWeek[4].date;

  React.useEffect(() => {
    getMenus()
      .then((res) => setMenus(res.data))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setSelectedDate(defaultDate);
  }, [defaultDate]);

  function handleSetToday(): void {
    setSelectedDate(defaultDate);
  }

  // "MM/DD" → "MM.DD" 로 변환해 API 응답 date 필드("05.12 (화)")와 비교
  function getMeals(category: 'BREAKFAST' | 'LUNCH' | 'DINNER'): string[] {
    if (!selectedDate) return [];
    const dotDate = selectedDate.replace('/', '.');
    // "등록된 식단 내용이 없습니다." 같은 안내 문구는 메뉴가 아니므로 빼서 식단 없음으로 보이고 평점도 숨긴다
    return cleanMeals(
      menus.find((m) => m.date.startsWith(dotDate) && m.menuCategory === category)?.meals ?? []
    );
  }

  // 평점 API는 yyyy-MM-dd를 받는다. 주말엔 오늘이 평일 목록에 없어 평점 영역을 숨긴다
  const selectedIso = dates.find((d) => d.date === selectedDate)?.iso;
  const canRate = selectedDate === today.date;

  const breakfast = getMeals('BREAKFAST');
  const lunch = getMeals('LUNCH');
  const dinner = getMeals('DINNER');

  return (
    <ScrollView className="native:w-screen web:w-full" contentContainerClassName="flex-grow">
      <View className="gap-4 border-b border-grey-10 bg-white pb-3 pt-4">
        <View className="flex-row items-center gap-2 px-6">
          <Text className="text-black text-body02">
            {today.date}({today.day})
          </Text>

          {/* 오늘 날짜로 돌아가기 버튼 */}
          {selectedDate !== defaultDate && (
            <TouchableOpacity onPress={handleSetToday}>
              <View className="flex-row items-center gap-0.5 rounded-full bg-blue-02 px-2 py-[3px]">
                <Text className="text-blue-20 text-caption01">오늘</Text>
                <UndoIcon size={12} className="text-blue-20" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 날짜 선택기 — 평일 5일을 화면 너비에 맞춰 균등 배분 */}
        <View className="flex-row gap-2 px-5">
          {dates.map((item) => {
            const isSelected = selectedDate === item.date;
            return (
              <TouchableOpacity
                key={item.date}
                className="flex-1"
                onPress={() => setSelectedDate(item.date)}
              >
                <View
                  className={cn(
                    'items-center gap-[6.5px] rounded-lg pb-[6.5px] pt-[4px]',
                    isSelected ? 'bg-mju-primary' : 'bg-white'
                  )}
                >
                  <Text className={cn('text-body04', isSelected ? 'text-white' : 'text-grey-60')}>
                    {item.day}
                  </Text>
                  <Text className={cn('text-body05', isSelected ? 'text-white' : 'text-grey-40')}>
                    {item.date}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View className="flex-1 gap-2.5 bg-grey-02 px-4 pb-9 pt-5">
        {/* 조식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <BreakfastMealIcon />
            <Text className="ms-1 text-black text-body02">조식</Text>
            <Text className="ms-2 text-grey-60 text-caption02">(08:00 - 09:00)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {breakfast.length > 0 ? (
              breakfast.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-grey-80 text-body05">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-grey-40 text-body05">식단 정보가 없습니다.</Text>
            )}
          </View>
          {selectedIso && breakfast.length > 0 && (
            <MealRating date={selectedIso} category="BREAKFAST" canRate={canRate} />
          )}
        </View>

        {/* 중식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <LunchMealIcon />
            <Text className="ms-1 text-black text-body02">중식</Text>
            <Text className="ms-2 text-grey-60 text-caption02">(11:30 - 14:00)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {lunch.length > 0 ? (
              lunch.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-grey-80 text-body05">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-grey-40 text-body05">식단 정보가 없습니다.</Text>
            )}
          </View>
          {selectedIso && lunch.length > 0 && (
            <MealRating date={selectedIso} category="LUNCH" canRate={canRate} />
          )}
        </View>

        {/* 석식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <DinnerMealIcon />
            <Text className="ms-1 text-black text-body02">석식</Text>
            <Text className="ms-2 text-grey-60 text-caption02">(17:00 - 18:30)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {dinner.length > 0 ? (
              dinner.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-grey-80 text-body05">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-grey-40 text-body05">식단 정보가 없습니다.</Text>
            )}
          </View>
          {selectedIso && dinner.length > 0 && (
            <MealRating date={selectedIso} category="DINNER" canRate={canRate} />
          )}
        </View>

        {/* 설명 */}
        <View className="gap-0.5 rounded-xl border border-blue-05 bg-blue-02 px-5 py-3">
          <View className="flex-row items-center">
            <LocationIcon size={16} className="text-blue-10" />
            <Text className="ms-1 text-grey-60 text-body05">인문캠퍼스 학생회관 3층 식당</Text>
          </View>
          <Text className="text-grey-60 text-body05">조식 ₩1,000 | 중식·석식 ₩6,500</Text>
          <Text className="text-grey-40 text-caption02">*평일만 운영됩니다.</Text>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}
