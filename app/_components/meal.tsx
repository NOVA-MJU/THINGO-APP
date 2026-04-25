import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useMenuData } from '@/hooks/useMenuData';
import type { MenuCategory } from '@/api/menu';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type MealSectionProps = {
  all?: boolean;
};

const EMPTY_MEAL_MARKERS = ['등록된 식단 내용이 없습니다.', '등록된 식단 내용이 없습니다'];

const normalizeMealText = (s: string) => s.replace(/\s+/g, '').trim();

const CATEGORY_ORDER: Array<{ category: MenuCategory; label: string }> = [
  { category: 'BREAKFAST', label: '아침' },
  { category: 'LUNCH', label: '점심' },
  { category: 'DINNER', label: '저녁' },
];

export default function MealSection({ all = false }: MealSectionProps) {
  const { isLoading, isFetching, isError, error, keys, todayKey, getByDate } = useMenuData();
  const [idx, setIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!keys.length) return;

    setIdx((prev) => {
      if (prev === null) {
        const todayIndex = keys.indexOf(todayKey);
        return todayIndex >= 0 ? todayIndex : 0;
      }

      const max = Math.max(0, keys.length - 1);
      return Math.min(Math.max(prev, 0), max);
    });
  }, [keys, todayKey]);

  const dateKey = keys[idx ?? 0] ?? todayKey;

  const dayItems = React.useMemo(() => {
    return getByDate(dateKey);
  }, [dateKey, getByDate]);

  React.useEffect(() => {
    if (!__DEV__) return;
  }, [dateKey, dayItems, error, idx, isError, isFetching, isLoading, keys, todayKey]);

  const mealsByCategory = React.useMemo(() => {
    const normalizedMarkers = EMPTY_MEAL_MARKERS.map(normalizeMealText);
    const map = new Map<MenuCategory, string[]>();

    CATEGORY_ORDER.forEach(({ category }) => {
      map.set(category, []);
    });

    dayItems.forEach((item) => {
      const sanitizedMeals = (item.meals ?? []).filter(
        (meal) => !normalizedMarkers.includes(normalizeMealText(meal))
      );

      map.set(item.menuCategory, sanitizedMeals);
    });

    return map;
  }, [dayItems]);

  const atStart = (idx ?? 0) <= 0;
  const atEnd = (idx ?? 0) >= keys.length - 1;

  React.useEffect(() => {
    if (!__DEV__) return;
  }, [mealsByCategory]);

  const onPrevClick = () => {
    if (atStart) return;
    setIdx((current) => (current == null ? 0 : Math.max(0, current - 1)));
  };

  const onNextClick = () => {
    if (atEnd) return;
    setIdx((current) => (current == null ? 0 : Math.min(keys.length - 1, current + 1)));
  };

  return (
    <View className="w-screen flex-1 bg-white">
      <View className="flex w-full flex-col gap-3 p-4">
        {isError && (
          <View className="border-error mb-2 rounded-2xl border p-4">
            <Text className="text-body05 text-error text-center">
              식단 데이터를 불러오지 못했습니다.
            </Text>
          </View>
        )}

        {!all && (
          <View className="flex flex-row items-center justify-center gap-4">
            <Pressable onPress={onPrevClick} disabled={atStart} accessibilityLabel="이전 날짜">
              <Icon
                as={ChevronLeft}
                size={24}
                className={atStart ? 'text-grey-10' : 'text-grey-40'}
              />
            </Pressable>

            <Text className="text-title03 text-black">{dateKey || '-'}</Text>

            <Pressable onPress={onNextClick} disabled={atEnd} accessibilityLabel="다음 날짜">
              <Icon
                as={ChevronRight}
                size={24}
                className={atEnd ? 'text-grey-10' : 'text-grey-40'}
              />
            </Pressable>
          </View>
        )}

        <View className="mb-5 flex flex-col gap-3">
          {CATEGORY_ORDER.map(({ category, label }) => {
            const meals = mealsByCategory.get(category) ?? [];

            return (
              <View key={category} className="border-grey-10 flex flex-col rounded-2xl border p-4">
                <Text className="text-body02 text-blue-20 text-center font-semibold">{label}</Text>

                <View className="bg-grey-10 mb-3 mt-2 h-px w-full" />

                <View className="flex flex-col">
                  {meals.length === 0 ? (
                    <View className="flex h-full min-h-[72px] items-center justify-center">
                      <Text className="text-body05 text-grey-30 text-center">
                        등록된 식단 내용이 없습니다.
                      </Text>
                    </View>
                  ) : (
                    <View className="flex flex-col gap-1 text-center">
                      {meals.map((meal, index) => (
                        <Text
                          key={`${category}-${index}`}
                          className="text-body05 text-grey-80 text-center">
                          {meal}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
