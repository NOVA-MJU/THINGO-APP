import type { KeywordAlarm } from '@/api/notifications';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { ALARM_CATEGORIES } from './category-selector';

type KeywordItemProps = {
  alarm: KeywordAlarm;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function KeywordItem({ alarm, deleting, onEdit, onDelete }: KeywordItemProps) {
  const categoryLabels = alarm.categories
    .map((value) => ALARM_CATEGORIES.find((category) => category.value === value)?.label)
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-row items-center rounded-xl border border-grey-10 bg-white px-4 py-3">
      <View className="min-w-0 flex-1">
        <Text className="text-body04 text-black" numberOfLines={1}>
          {alarm.keyword}
        </Text>
        <Text className="mt-0.5 text-caption02 text-grey-40" numberOfLines={1}>
          {categoryLabels}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${alarm.keyword} 카테고리 수정`}
        onPress={onEdit}
        hitSlop={8}
        className="ml-2 rounded-full p-2 active:bg-grey-02"
      >
        <Icon as={Pencil} size={19} className="text-grey-60" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${alarm.keyword} 삭제`}
        onPress={onDelete}
        disabled={deleting}
        hitSlop={8}
        className="rounded-full p-2 active:bg-grey-02"
      >
        <Icon as={Trash2} size={19} className="text-error" />
      </Pressable>
    </View>
  );
}
