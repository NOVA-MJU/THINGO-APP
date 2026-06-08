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

export default function MealScreen() {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [menus, setMenus] = React.useState<DailyMenu[]>([]);
  const dateScrollRef = React.useRef<ScrollView>(null);

  // 오늘 날짜(today)와 이번 주 평일 목록(dates) 계산 — 마운트 시 1회만 실행
  const { today, dates } = React.useMemo(() => {
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

    const result: { day: string; date: string }[] = [];
    for (let weekday = 0; weekday < 5; weekday++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + weekday);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      result.push({ date: `${m}/${day}`, day: DAY_NAMES[d.getDay()] });
    }
    return { today: todayObj, dates: result };
  }, []);

  React.useEffect(() => {
    setSelectedDate(today.date);
    getMenus()
      .then((res) => setMenus(res.data))
      .catch(() => {});
  }, [today.date]);

  function handleSetToday(): void {
    setSelectedDate(today.date);
  }

  // "MM/DD" → "MM.DD" 로 변환해 API 응답 date 필드("05.12 (화)")와 비교
  function getMeals(category: 'BREAKFAST' | 'LUNCH' | 'DINNER'): string[] {
    if (!selectedDate) return [];
    const dotDate = selectedDate.replace('/', '.');
    return (
      menus.find((m) => m.date.startsWith(dotDate) && m.menuCategory === category)?.meals ?? []
    );
  }

  const breakfast = getMeals('BREAKFAST');
  const lunch = getMeals('LUNCH');
  const dinner = getMeals('DINNER');

  return (
    <ScrollView className="w-screen" contentContainerClassName="flex-grow">
      <View className="gap-4 border-b border-grey-10 bg-white pb-3 pt-4">
        <View className="flex-row items-center gap-2 px-6">
          <Text className="text-body02 text-black">
            {today.date}({today.day})
          </Text>

          {selectedDate !== today.date && (
            <TouchableOpacity onPress={handleSetToday}>
              <View className="flex-row items-center gap-0.5 rounded-full bg-blue-02 px-2 py-[3px]">
                <Text className="text-caption01 text-blue-20">오늘</Text>
                <UndoIcon size={12} className="text-blue-20" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 날짜 선택기 */}
        <ScrollView
          ref={dateScrollRef}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 flex-row gap-2"
        >
          {dates.map((item) => {
            const isSelected = selectedDate === item.date;
            return (
              <TouchableOpacity key={item.date} onPress={() => setSelectedDate(item.date)}>
                <View
                  className={cn(
                    'w-[60px] items-center gap-[6.5px] rounded-lg pb-[6.5px] pt-[4px]',
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
        </ScrollView>
      </View>
      <View className="w-screen flex-1 gap-2.5 bg-grey-02 px-4 pb-9 pt-5">
        {/* 조식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <BreakfastMealIcon />
            <Text className="ms-1 text-body02 text-black">조식</Text>
            <Text className="ms-2 text-caption02 text-grey-60">(08:00 - 09:00)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {breakfast.length > 0 ? (
              breakfast.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-body05 text-grey-80">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-body05 text-grey-40">식단 정보가 없습니다.</Text>
            )}
          </View>
        </View>

        {/* 중식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <LunchMealIcon />
            <Text className="ms-1 text-body02 text-black">중식</Text>
            <Text className="ms-2 text-caption02 text-grey-60">(11:30 - 14:00)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {lunch.length > 0 ? (
              lunch.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-body05 text-grey-80">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-body05 text-grey-40">식단 정보가 없습니다.</Text>
            )}
          </View>
        </View>

        {/* 석식 */}
        <View className="gap-2.5 rounded-xl bg-white px-4 py-5">
          <View className="flex-row items-center">
            <DinnerMealIcon />
            <Text className="ms-1 text-body02 text-black">석식</Text>
            <Text className="ms-2 text-caption02 text-grey-60">(17:00 - 18:30)</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {dinner.length > 0 ? (
              dinner.map((meal) => (
                <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                  <Text className="text-body05 text-grey-80">{meal}</Text>
                </View>
              ))
            ) : (
              <Text className="text-body05 text-grey-40">식단 정보가 없습니다.</Text>
            )}
          </View>
        </View>

        {/* 설명 */}
        <View className="gap-0.5 rounded-xl border border-blue-05 bg-blue-02 px-5 py-3">
          <View className="flex-row items-center">
            <LocationIcon size={16} className="text-blue-10" />
            <Text className="ms-1 text-body05 text-grey-60">인문캠퍼스 학생회관 3층 식당</Text>
          </View>
          <Text className="text-body05 text-grey-60">조식 ₩1,000 | 중식·석식 ₩6,500</Text>
          <Text className="text-caption02 text-grey-40">*평일만 운영됩니다.</Text>
        </View>
      </View>
      <Footer withBottomInset />
    </ScrollView>
  );
}
