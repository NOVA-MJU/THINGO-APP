import type { AlarmCategory } from '@/api/notifications';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Pressable, View } from 'react-native';

export const ALARM_CATEGORIES: { value: AlarmCategory; label: string }[] = [
  { value: 'NOTICE', label: '공지사항' },
  { value: 'MJU_CALENDAR', label: '학사일정' },
  { value: 'COMMUNITY', label: '게시판' },
  { value: 'CAFETERIA', label: '학식' },
];

type CategorySelectorProps = {
  value: AlarmCategory[];
  onChange: (categories: AlarmCategory[]) => void;
  onReset?: () => void;
};

export function CategorySelector({ value, onChange, onReset }: CategorySelectorProps) {
  function toggle(category: AlarmCategory) {
    onChange(
      value.includes(category) ? value.filter((item) => item !== category) : [...value, category]
    );
  }

  return (
    <View>
      <View className="flex-row items-center gap-1">
        <Text className="text-body04 text-grey-80">카테고리</Text>
        <Text className="text-caption02 text-grey-40">1개 이상 선택</Text>
      </View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {onReset && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="카테고리 선택 리셋"
            onPress={onReset}
            className="h-9 flex-row items-center gap-1 rounded-full border border-grey-10 bg-white px-3"
          >
            <Icon as={RotateCcw} size={15} className="text-grey-40" />
            <Text className="text-caption01 text-grey-40">리셋</Text>
          </Pressable>
        )}
        {ALARM_CATEGORIES.map((category) => {
          const selected = value.includes(category.value);
          return (
            <Pressable
              key={category.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => toggle(category.value)}
              className={cn(
                'h-9 justify-center rounded-full border px-3',
                selected ? 'border-blue-35 bg-blue-05' : 'border-grey-10 bg-white'
              )}
            >
              <Text className={cn('text-body05', selected ? 'text-blue-35' : 'text-grey-60')}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
