import type { AlarmCategory } from '@/api/notifications';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react-native';
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
  variant?: 'default' | 'sheet';
};

export function CategorySelector({
  value,
  onChange,
  onReset,
  variant = 'default',
}: CategorySelectorProps) {
  const sheetVariant = variant === 'sheet';

  function toggle(category: AlarmCategory) {
    onChange(
      value.includes(category) ? value.filter((item) => item !== category) : [...value, category]
    );
  }

  return (
    <View>
      <View className="flex-row items-center gap-1">
        <Text
          className={
            sheetVariant ? 'text-body02 font-semibold text-grey-80' : 'text-body04 text-grey-80'
          }
        >
          카테고리
        </Text>
        <Text
          className={sheetVariant ? 'text-caption05 text-grey-40' : 'text-caption02 text-grey-40'}
        >
          {sheetVariant ? '(1개 이상 선택)' : '1개 이상 선택'}
        </Text>
      </View>
      <View className={cn('flex-row flex-wrap gap-2', sheetVariant ? 'mt-2.5' : 'mt-2')}>
        {onReset && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="카테고리 선택 리셋"
            onPress={onReset}
            className={cn(
              'items-center justify-center rounded-full active:opacity-70',
              sheetVariant ? 'h-[30px] w-[30px] bg-grey-02' : 'h-[30px] w-[30px] bg-grey-02'
            )}
          >
            <Icon as={RotateCcw} size={sheetVariant ? 18 : 15} className="text-grey-40" />
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
                'justify-center rounded-full border active:opacity-70',
                'h-[30px] px-3',
                selected ? 'border-blue-15 bg-blue-05' : 'border-grey-10 bg-white'
              )}
            >
              <Text className={cn('text-body05', selected ? 'text-blue-35' : 'text-grey-40')}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
