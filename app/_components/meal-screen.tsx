import { Footer } from '@/components/footer';
import {
  BreakfastMealIcon,
  DinnerMealIcon,
  LocationIcon,
  LunchMealIcon,
  UndoIcon,
} from '@/components/icons';
import { Text } from '@/components/ui/text';
import { clsx } from 'clsx';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MealScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const dateScrollRef = React.useRef<ScrollView>(null);

  const { today, dates } = React.useMemo(() => {
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayObj = { date: `${mm}/${dd}`, day: DAY_NAMES[now.getDay()] };

    // 이번 주 월요일 구하기 (일요일=0이면 -6, 그 외 -(요일-1))
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    // 3주 전 월요일부터 이번 주 금요일까지 평일만
    const result: { day: string; date: string }[] = [];
    for (let week = -3; week <= 0; week++) {
      for (let weekday = 0; weekday < 5; weekday++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + week * 7 + weekday);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        result.push({ date: `${m}/${day}`, day: DAY_NAMES[d.getDay()] });
      }
    }

    return { today: todayObj, dates: result };
  }, []);

  const handleScrollDatePicker = React.useCallback(
    (animated = true) => {
      const todayIndex = dates.findIndex((d) => d.date === today.date);
      if (todayIndex !== -1) {
        const x = 20 + todayIndex * (60 + 8);
        dateScrollRef.current?.scrollTo({ x, animated });
      }
    },
    [dates, today.date]
  );

  React.useEffect(() => {
    setSelectedDate(today.date);
    handleScrollDatePicker(false);
  }, [today.date, handleScrollDatePicker]);

  function handleSetToday(): void {
    setSelectedDate(today.date);
    handleScrollDatePicker();
  }

  return (
    <ScrollView
      className="w-screen"
      contentContainerStyle={{ paddingBottom: insets.bottom, flexGrow: 1 }}
    >
      <View className="gap-4 border-b border-grey-10 bg-white pb-3 pt-4">
        <View className="flex-row items-center gap-2 px-6">
          <Text className="text-body02 text-black">
            {today.date}({today.day})
          </Text>

          {/* 오늘 날짜로 이동 */}
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
                  className={clsx(
                    'w-[60px] items-center gap-[6.5px] rounded-lg pb-[6.5px] pt-[4px]',
                    isSelected ? 'bg-mju-primary' : 'bg-white'
                  )}
                >
                  <Text className={clsx('text-body04', isSelected ? 'text-white' : 'text-grey-60')}>
                    {item.day}
                  </Text>
                  <Text className={clsx('text-body05', isSelected ? 'text-white' : 'text-grey-40')}>
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
            {DUMMY_MENU.breakfast.map((meal) => (
              <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                <Text className="text-body05 text-grey-80">{meal}</Text>
              </View>
            ))}
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
            {DUMMY_MENU.lunch.map((meal) => (
              <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                <Text className="text-body05 text-grey-80">{meal}</Text>
              </View>
            ))}
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
            {DUMMY_MENU.dinner.map((meal) => (
              <View key={meal} className="rounded-sm bg-grey-02 px-1 py-0.5">
                <Text className="text-body05 text-grey-80">{meal}</Text>
              </View>
            ))}
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
      <Footer />
    </ScrollView>
  );
}

const DUMMY_MENU = {
  breakfast: ['현미밥', '된장찌개', '이름긴메뉴이름', '계란후라이', '깍두기'],
  lunch: ['잡곡밥', '김치찌개', '제육볶음', '콩나물무침', '깍두기', '코다리무침'],
  dinner: ['흰쌀밥', '미역국', '불고기', '나물무침', '배추김치', '콰트로치즈와퍼주니어'],
};
