import type { NotificationItem as NotificationItemType } from '@/api/notifications';
import { Text } from '@/components/ui/text';
import { cn, formatTimeAgo } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type NotificationItemProps = {
  item: NotificationItemType;
  onPress: () => void;
};

export function NotificationItem({ item, onPress }: NotificationItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.category} 알림, ${item.title}`}
      onPress={onPress}
      className={cn(
        'gap-1.5 border-t-[1.5px] border-grey-02 px-4 py-2.5',
        item.read ? 'bg-white' : 'bg-blue-02'
      )}
    >
      <View className="flex-row items-center gap-1">
        {/* 카테고리 표시 */}
        <View
          className={cn(
            'w-fit rounded-[4px] px-[5.5px] py-[1.5px]',
            item.read ? 'bg-blue-05' : 'bg-white'
          )}
        >
          <Text className={cn('text-caption05', item.read ? 'text-blue-10' : 'text-blue-20')}>
            {item.category}
          </Text>
        </View>

        {/* 등록 키워드 표시 */}
        <Text className="text-caption02 text-grey-40">{`#${item.keyword}`}</Text>
      </View>

      {/* 알림 제목 */}
      <Text className="w-full text-body05 text-black" numberOfLines={2}>
        {item.title}
      </Text>

      {/* 알림 날짜 */}
      <Text className="text-caption02 text-grey-20" numberOfLines={1}>
        {formatTimeAgo(item.sentAt)}
      </Text>
    </Pressable>
  );
}
