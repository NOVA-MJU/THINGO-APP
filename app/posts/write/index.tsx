import { Footer } from '@/app/_components/footer';
import { ArrowBackIcon, InfoOutlineIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { router } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BoardOption = NonNullable<Option>;

type DevAuthToggleProps = {
  isLoggedIn: boolean;
  onChange: (next: boolean) => void;
  topOffset: number;
};

type WriteFormProps = {
  title: string;
  content: string;
  category: Option;
  canSubmit: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCategoryChange: (value: Option) => void;
  onSubmit: () => void;
  bottomInset: number;
};

type LoggedOutViewProps = {
  bottomInset: number;
  onLoginPress: () => void;
};

export default function BoardWriteScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState<Option>(DEFAULT_BOARD_OPTION);
  const [exitDialogOpen, setExitDialogOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(MOCK_DEFAULT_LOGGED_IN);

  const isDirty =
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    category?.value !== DEFAULT_BOARD_OPTION.value;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handleBackPress = () => {
    if (!isLoggedIn || !isDirty) {
      router.back();
      return;
    }

    setExitDialogOpen(true);
  };

  const handleDiscard = () => {
    setExitDialogOpen(false);
    router.back();
  };

  const handleSubmit = () => {
    Alert.alert('준비 중', PREPARE_POST_MESSAGE);
  };

  const handleLoginPress = () => {
    Alert.alert('준비 중', PREPARE_LOGIN_MESSAGE);
  };

  const handleMockAuthToggle = () => {
    if (!__DEV__) return;

    setIsLoggedIn((prev) => {
      const next = !prev;

      Alert.alert(
        'Mock 상태 변경',
        next ? '로그인 화면으로 전환했습니다.' : '비로그인 화면으로 전환했습니다.'
      );
      return next;
    });

    setExitDialogOpen(false);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <DevAuthToggle isLoggedIn={isLoggedIn} onChange={setIsLoggedIn} topOffset={insets.top + 6} />

      {/* header */}
      <View className="px-4 pt-4">
        <Pressable
          onPress={handleBackPress}
          onLongPress={handleMockAuthToggle}
          className="flex-row items-center gap-1 self-start"
          accessibilityRole="button"
          accessibilityLabel="이전">
          <ArrowBackIcon className="text-black" />
          <Text className="text-body03 text-black">이전</Text>
        </Pressable>
      </View>

      {/* content */}
      {isLoggedIn ? (
        <WriteForm
          title={title}
          content={content}
          category={category}
          canSubmit={canSubmit}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onCategoryChange={setCategory}
          onSubmit={handleSubmit}
          bottomInset={insets.bottom}
        />
      ) : (
        <LoggedOutView bottomInset={insets.bottom} onLoginPress={handleLoginPress} />
      )}

      {/* exit dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="mx-6 w-[320px] max-w-[320px] gap-4 rounded-xl border-none py-[24px]">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-center text-body03 text-black">
              게시물 작성을 중단하시겠습니까?
            </DialogTitle>
            <DialogDescription className="text-center text-body06 text-grey-80">
              기록된 모든 내용이 삭제됩니다.
            </DialogDescription>
          </DialogHeader>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setExitDialogOpen(false)}
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-grey-10">
              <Text className="text-body06 text-black">취소</Text>
            </Pressable>

            <Pressable
              onPress={handleDiscard}
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-error">
              <Text className="text-body06 text-white">그만하기</Text>
            </Pressable>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function DevAuthToggle({ isLoggedIn, onChange, topOffset }: DevAuthToggleProps) {
  if (!__DEV__) return null;

  return (
    <View
      className="absolute right-4 z-20 flex-row rounded-full bg-black/80 p-1"
      style={{ top: topOffset }}>
      <Pressable
        onPress={() => onChange(true)}
        className={cn('rounded-full px-3 py-1.5', isLoggedIn ? 'bg-white' : 'bg-transparent')}>
        <Text className={cn('text-caption02', isLoggedIn ? 'text-black' : 'text-white')}>
          로그인
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(false)}
        className={cn('rounded-full px-3 py-1.5', !isLoggedIn ? 'bg-white' : 'bg-transparent')}>
        <Text className={cn('text-caption02', !isLoggedIn ? 'text-black' : 'text-white')}>
          비로그인
        </Text>
      </Pressable>
    </View>
  );
}

function WriteForm({
  title,
  content,
  category,
  canSubmit,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onSubmit,
  bottomInset,
}: WriteFormProps) {
  return (
    <ScrollView
      className="flex-1 bg-white"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomInset }}>
      <View className="flex-1 justify-between">
        <View className="px-4 pb-8 pt-8">
          <View className="gap-3.5">
            <Input
              value={title}
              onChangeText={onTitleChange}
              placeholder="제목"
              placeholderTextColor="text-grey-20"
              className="h-[40px] rounded-xl border-grey-10 bg-white px-3 text-body03 text-black"
            />

            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-[40px] w-full rounded-xl border-grey-10 bg-white px-3">
                <SelectValue placeholder="자유게시판" className="text-body03 text-blue-20" />
              </SelectTrigger>
              <SelectContent>
                {BOARD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} label={option.label} />
                ))}
              </SelectContent>
            </Select>

            <TextInput
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={onContentChange}
              placeholder="자유롭게 말을 남겨보세요"
              placeholderTextColor="text-grey-20"
              className="h-[350px] rounded-xl border border-grey-10 bg-white px-3 py-3 text-body06 text-black"
            />
          </View>

          <Button
            variant={canSubmit ? 'default' : 'muted'}
            disabled={!canSubmit}
            onPress={onSubmit}
            className={cn('mt-4 h-[40px] rounded-xl', canSubmit ? 'bg-blue-35' : 'bg-grey-02')}>
            <Text className={cn('text-body05', canSubmit ? 'text-white' : 'text-grey-40')}>
              완료
            </Text>
          </Button>
        </View>

        <Footer />
      </View>
    </ScrollView>
  );
}

function LoggedOutView({ bottomInset, onLoginPress }: LoggedOutViewProps) {
  return (
    <View className="flex-1 justify-between bg-white">
      <View className="flex-1 items-center justify-center px-4 pb-16">
        <InfoOutlineIcon width={24} height={24} className="text-grey-20" />
        <Text className="mt-3 text-body03 text-grey-30">로그인 후 이용 가능합니다.</Text>

        <Button onPress={onLoginPress} className="mt-10 h-[40px] w-full rounded-xl bg-blue-35">
          <Text className="text-body05 text-white">Thingo 로그인하기</Text>
        </Button>
      </View>

      <View style={{ paddingBottom: bottomInset }}>
        <Footer />
      </View>
    </View>
  );
}

// dummy data
const PREPARE_POST_MESSAGE = '게시글 작성 API 연동 전입니다.';
const PREPARE_LOGIN_MESSAGE = '로그인 화면 연결 전입니다.';
const MOCK_DEFAULT_LOGGED_IN = true;
const DEFAULT_BOARD_OPTION: BoardOption = { value: 'info', label: '정보게시판' };
const BOARD_OPTIONS: BoardOption[] = [DEFAULT_BOARD_OPTION, { value: 'free', label: '자유게시판' }];
