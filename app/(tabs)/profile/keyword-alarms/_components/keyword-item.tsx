import type { KeywordAlarm } from '@/api/notifications';
import { AlertOffIcon, AlertOnIcon } from '@/components/icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SquarePen } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type KeywordItemProps = {
  alarm: KeywordAlarm;
  disabled?: boolean;
  onEdit: () => void;
  onToggleEnabled: () => void;
};

export default function KeywordItem({
  alarm,
  disabled = false,
  onEdit,
  onToggleEnabled,
}: KeywordItemProps) {
  return (
    <View className="h-[58px] flex-row items-center border-b border-grey-02 bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${alarm.keyword} 알림 ${alarm.enabled ? '끄기' : '켜기'}`}
        accessibilityState={{ checked: alarm.enabled, disabled }}
        onPress={onToggleEnabled}
        disabled={disabled}
        hitSlop={8}
        className="h-[58px] w-[26px] items-start justify-center active:opacity-70 disabled:opacity-50"
      >
        {alarm.enabled ? (
          <AlertOnIcon size={20} className="text-blue-10" />
        ) : (
          <AlertOffIcon size={20} className="text-grey-30" />
        )}
      </Pressable>
      <Text className="min-w-0 flex-1 text-grey-80 text-body03" numberOfLines={1}>
        {alarm.keyword}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${alarm.keyword} 키워드 수정`}
        onPress={onEdit}
        hitSlop={8}
        className="h-[58px] w-8 items-center justify-center active:opacity-70"
      >
        <Icon as={SquarePen} size={18} className="text-grey-30" />
      </Pressable>
    </View>
  );
}
