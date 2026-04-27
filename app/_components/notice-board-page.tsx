import { ChatBubbleIcon, HeartIcon } from '@/components/icons';
import { Pagination } from '@/components/ui/pagination';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import { ClipboardPen } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footer } from './footer';

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

const ITEMS_PER_PAGE = 10;
const PUBLISHED_DATES = ['2025.XX.XX', '2025.XX.XX', '2025.XX.XX', '2025.XX.XX'];
const PREVIEW_COPY = [
  '게시판 본문 내용은 최대 2줄까지만 노출\n게시판 본문 내용이 2줄 이상일 경우에는 이런 형식으로 ...',
  '게시판 본문 내용은 최대 2줄까지만 노출\n게시판 본문 내용이 2줄 이상일 경우에는 이런 형식으로 ...',
  '게시판 본문 내용은 최대 2줄까지만 노출\n게시판 본문 내용이 2줄 이상일 경우에는 이런 형식으로 ...',
];

const BOARD_ITEMS: BoardItem[] = Array.from({ length: 100 }, (_, index) => ({
  id: `board-${index + 1}`,
  category: index % 2 === 0 ? 'free' : 'info',
  title: '게시판 제목',
  preview: PREVIEW_COPY[index % PREVIEW_COPY.length],
  likeCount: 'NN',
  commentCount: 'NN',
  publishedAt: PUBLISHED_DATES[index % PUBLISHED_DATES.length],
  isPressed: index === 0 || index === 1,
  isHot: index % 9 === 4,
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
        side === 'left' && (isActive ? 'rounded-tr-sm' : 'border-r'),
        side === 'right' && (isActive ? 'rounded-tl-sm' : '')
      )}>
      <Text className={cn(isActive ? 'text-body04 text-black' : 'text-body05 text-grey-40')}>
        {label}
      </Text>
    </Pressable>
  );
}

function BoardHotBadge() {
  return (
    <View className="h-[20px] w-[40px] items-center justify-center self-start rounded-full bg-blue-20 px-[8px]">
      <Text className="text-[11px] text-caption04 text-white">HOT</Text>
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
      className={cn('border-b border-grey-10 px-4 pb-2 pt-2', item.isPressed && 'bg-blue-05')}>
      <View className="gap-2">
        <View className="gap-1.5">
          <View className="flex-row items-center gap-1.5">
            {item.isHot && <BoardHotBadge />}
            <Text className="text-body04 text-black">{item.title}</Text>
          </View>

          <Text className="pr-2 text-[14px] leading-[18px] text-black" numberOfLines={2}>
            {item.preview}
          </Text>
        </View>

        <View className="mt-0.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-0.5">
              <HeartIcon
                width={24}
                height={24}
                className="text-[#8BC7FF]"
                filled={Boolean(item.isPressed)}
              />
              <Text className="text-caption02 text-grey-40">{item.likeCount}</Text>
            </View>

            <View className="flex-row items-center gap-0.5">
              <ChatBubbleIcon width={24} height={24} className="text-[#8BC7FF]" />
              <Text className="text-caption02 text-grey-40">{item.commentCount}</Text>
            </View>
          </View>

          <Text className="text-caption02 text-grey-40">{item.publishedAt}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function WriteButton({ bottomOffset, onPress }: { bottomOffset: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-4 h-[70px] w-[70px] items-center justify-center rounded-full bg-blue-35 p-[10px]"
      style={{
        bottom: bottomOffset,
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}>
      <View className="items-center justify-center">
        <ClipboardPen size={24} color="#E8F1FF" strokeWidth={2} />
        <Text className="text-[12px] text-caption02 leading-[18px] text-[#E8F1FF]">글남기기</Text>
      </View>
    </Pressable>
  );
}

function NoticeBoardScreen() {
  const { bottom } = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = React.useState<BoardCategory>('info');
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredItems = React.useMemo(
    () => BOARD_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const pagedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 20 }}>
        <View className="bg-white pt-5">
          <View className="bg-white">
            {pagedItems.map((item) => (
              <BoardCard key={item.id} item={item} />
            ))}
          </View>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mb-7 mt-6"
          />

          <Footer />
        </View>
      </ScrollView>

      <WriteButton bottomOffset={bottom + 88} onPress={() => router.push('/posts/write')} />
    </View>
  );
}

export { NoticeBoardScreen };
export default NoticeBoardScreen;
