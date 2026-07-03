import type { NotificationItem as NotificationItemType, NotificationType } from '@/api/notifications';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CalendarDays, ChevronRight, Megaphone, MessageSquare, Utensils } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: typeof Megaphone; iconClassName: string; backgroundClassName: string }
> = {
  NOTICE: {
    label: '공지사항',
    icon: Megaphone,
    iconClassName: 'text-blue-35',
    backgroundClassName: 'bg-blue-05',
  },
  MJU_CALENDAR: {
    label: '학사일정',
    icon: CalendarDays,
    iconClassName: 'text-mju-secondary',
    backgroundClassName: 'bg-blue-02',
  },
  COMMUNITY: {
    label: '게시판',
    icon: MessageSquare,
    iconClassName: 'text-grey-60',
    backgroundClassName: 'bg-grey-02',
  },
  WEEKLY_MENU: {
    label: '학식',
    icon: Utensils,
    iconClassName: 'text-error',
    backgroundClassName: 'bg-grey-02',
  },
};

function parseSentAt(value: string): Date {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimeZone ? value : `${value}Z`);
}

function formatNotificationTime(value: string): string {
  const date = parseSentAt(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return '어제';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

type NotificationItemProps = {
  item: NotificationItemType;
  onPress: () => void;
};

export function NotificationItem({ item, onPress }: NotificationItemProps) {
  const meta = TYPE_META[item.type];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} 알림, ${item.title}`}
      onPress={onPress}
      className={cn(
        'mx-4 flex-row items-center rounded-xl border px-3 py-3 active:opacity-70',
        item.read ? 'border-grey-10 bg-white' : 'border-blue-10 bg-blue-02'
      )}
    >
      <View className={cn('mr-3 rounded-lg p-2.5', meta.backgroundClassName)}>
        <Icon as={meta.icon} size={22} className={meta.iconClassName} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className={cn('text-caption01', item.read ? 'text-grey-40' : 'text-blue-35')}>
            {meta.label}
          </Text>
          {item.matchedKeyword ? (
            <Text className="max-w-[96px] text-caption02 text-grey-40" numberOfLines={1}>
              #{item.matchedKeyword}
            </Text>
          ) : null}
          <Text className="ml-auto text-caption02 text-grey-30">
            {formatNotificationTime(item.sentAt)}
          </Text>
        </View>
        <Text
          className={cn('mt-1', item.read ? 'text-body05 text-grey-60' : 'text-body04 text-black')}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>
      <Icon as={ChevronRight} size={20} className="ml-2 text-grey-30" />
    </Pressable>
  );
}
