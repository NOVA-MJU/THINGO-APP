import { ChatBubbleIcon, HeartIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type BoardCategory = 'info' | 'free';

type BoardItem = {
  id: string;
  category: BoardCategory;
  title: string;
  preview: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  isHot?: boolean;
  isPressed?: boolean;
};

const BOARD_TABS: Array<{ key: BoardCategory; label: string }> = [
  { key: 'info', label: '정보 게시판' },
  { key: 'free', label: '자유 게시판' },
];

const BOARD_ITEMS: BoardItem[] = Array.from({ length: 6 }, (_, index) => ({
  id: `board-${index + 1}`,
  category: index < 3 ? 'info' : 'free',
  title: '게시판 제목',
  preview:
    '게시판 본문 내용은 최대 2줄까지만 노출\n게시판 본문 내용이 2줄 이상일 경우에는 이런 형식으로 ㅇㅇㅇㅇㅇ',
  likeCount: 'NN',
  commentCount: 'NN',
  publishedAt: '2025.XX.XX',
  isPressed: index === 0 || index === 3,
  isHot: index === 2 || index === 5,
}));

type BoardTabButtonProps = {
  label: string;
  isActive: boolean;
  side: 'left' | 'right';
  onPress: () => void;
};

function BoardTabButton({ label, isActive, side, onPress }: BoardTabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-[39.3px] flex-1 items-center justify-center border-grey-10',
        isActive ? 'border-t bg-white' : 'border-b bg-grey-02',
        side === 'left' && (isActive ? 'rounded-tr-sm border-r' : 'border-r'),
        side === 'right' && (isActive ? 'rounded-tl-sm border-l' : '')
      )}>
      <Text className={cn(isActive ? 'text-body04 text-black' : 'text-body05 text-grey-40')}>
        {label}
      </Text>
    </Pressable>
  );
}

function BoardHotBadge() {
  return (
    <View className="self-start rounded-full bg-blue-20 px-2 py-1">
      <Text className="text-caption04 text-white">HOT</Text>
    </View>
  );
}

type BoardCardProps = {
  item: BoardItem;
  onPress?: () => void;
};

function BoardCard({ item, onPress }: BoardCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn('h-[110px] border-b border-grey-10 px-4 py-4', item.isPressed && 'bg-blue-05')}>
      <View className="flex-1 gap-2">
        <View className="gap-1">
          <View className="flex-row items-center gap-1">
            {item.isHot && <BoardHotBadge />}
            <Text className="text-body04 text-black">{item.title}</Text>
          </View>

          <Text className="h-[42px] w-[361px] text-body05 text-black" numberOfLines={2}>
            {item.preview}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <HeartIcon size={24} className="text-blue-10" filled={Boolean(item.isPressed)} />
              <Text className="text-body05 text-grey-40">{item.likeCount}</Text>
            </View>

            <View className="flex-row items-center gap-1">
              <ChatBubbleIcon size={24} className="text-blue-10" />
              <Text className="text-body05 text-grey-40">{item.commentCount}</Text>
            </View>
          </View>

          <Text className="text-caption02 text-grey-40">{item.publishedAt}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Page1() {
  const [activeCategory, setActiveCategory] = React.useState<BoardCategory>('info');

  const filteredItems = React.useMemo(
    () => BOARD_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  return (
    <View className="w-screen flex-1 bg-white">
      <View className="bg-grey-02 pt-2">
        <View className="flex-row">
          <BoardTabButton
            label={BOARD_TABS[0].label}
            isActive={activeCategory === 'info'}
            side="left"
            onPress={() => setActiveCategory('info')}
          />
          <BoardTabButton
            label={BOARD_TABS[1].label}
            isActive={activeCategory === 'free'}
            side="right"
            onPress={() => setActiveCategory('free')}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <View className="gap-2 bg-white pt-5">
          {filteredItems.map((item) => (
            <BoardCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export { Page1 };
export default Page1;
