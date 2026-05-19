import { createBoard, getBoardDetail, updateBoard, type CommunityCategory } from '@/api/posts';
import { Footer } from '@/components/footer';
import { ArrowLeftIcon, InfoOutlineIcon } from '@/components/icons';
import { PostEditor, type PostEditorHandle, type PostEditorValue } from '@/components/post-editor';
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
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { buildContentPreview, normalizePostContent } from '@/lib/post-content';
import { cn } from '@/lib/utils';
import { useKeyboard } from '@10play/tentap-editor';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, BackHandler, Keyboard, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BoardOption = NonNullable<Option>;
type BoardOptionValue = 'info' | 'free';

type WriteFormProps = {
  isEditMode: boolean;
  title: string;
  contentHtml: string;
  category: Option;
  canSubmit: boolean;
  isSubmitting: boolean;
  editorRef: React.RefObject<PostEditorHandle | null>;
  onTitleChange: (value: string) => void;
  onContentChange: (value: PostEditorValue) => void;
  onCategoryChange: (value: Option) => void;
  onSubmit: () => void;
  bottomInset: number;
};

type LoggedOutViewProps = {
  bottomInset: number;
  onLoginPress: () => void;
};

type InitialFormState = {
  title: string;
  contentText: string;
  categoryValue: string;
};

const DEFAULT_BOARD_OPTION: BoardOption = { value: 'info', label: '정보게시판' };
const BOARD_OPTIONS: BoardOption[] = [DEFAULT_BOARD_OPTION, { value: 'free', label: '자유게시판' }];

const DEFAULT_FORM_STATE: InitialFormState = {
  title: '',
  contentText: '',
  categoryValue: DEFAULT_BOARD_OPTION.value,
};

export default function BoardWriteScreen() {
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId?: string | string[] }>();
  const editingBoardUUID = Array.isArray(postId) ? postId[0] : postId;
  const isEditMode = Boolean(editingBoardUUID);
  const { user, isInitializing } = useAuth();
  const editorRef = React.useRef<PostEditorHandle>(null);
  const [title, setTitle] = React.useState('');
  const [contentHtml, setContentHtml] = React.useState('');
  const [contentText, setContentText] = React.useState('');
  const [category, setCategory] = React.useState<Option>(DEFAULT_BOARD_OPTION);
  const [exitDialogOpen, setExitDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isPrefillLoading, setIsPrefillLoading] = React.useState(false);
  const [prefillErrorMessage, setPrefillErrorMessage] = React.useState<string | null>(null);
  const [initialFormState, setInitialFormState] =
    React.useState<InitialFormState>(DEFAULT_FORM_STATE);

  const isLoggedIn = Boolean(user);
  const isDirty =
    title.trim() !== initialFormState.title ||
    contentText.trim() !== initialFormState.contentText ||
    category?.value !== initialFormState.categoryValue;
  const canSubmit = title.trim().length > 0 && contentText.trim().length > 0;

  const loadBoardForEdit = React.useCallback(async () => {
    if (!editingBoardUUID || !user) return;

    setIsPrefillLoading(true);
    setPrefillErrorMessage(null);

    try {
      const board = await getBoardDetail(editingBoardUUID);

      if (!board.canEdit) {
        setPrefillErrorMessage('게시글 수정 권한이 없습니다.');
        return;
      }

      const normalizedHtml = normalizePostContent(board.content);
      const normalizedText = htmlToPlainText(normalizedHtml);
      const nextCategory = getBoardOptionFromCategory(board.communityCategory);

      setTitle(board.title);
      setContentHtml(normalizedHtml);
      setContentText(normalizedText);
      setCategory(nextCategory);
      setInitialFormState({
        title: board.title.trim(),
        contentText: normalizedText,
        categoryValue: nextCategory.value,
      });
    } catch {
      setPrefillErrorMessage('게시글을 불러오지 못했습니다.');
    } finally {
      setIsPrefillLoading(false);
    }
  }, [editingBoardUUID, user]);

  React.useEffect(() => {
    if (isInitializing) return;
    if (!isEditMode) return;
    if (!user) return;
    void loadBoardForEdit();
  }, [isEditMode, isInitializing, loadBoardForEdit, user]);

  const handleBackPress = React.useCallback(() => {
    if (isSubmitting) return true;

    if (!isLoggedIn || !isDirty) {
      router.back();
      return true;
    }

    editorRef.current?.blur();
    Keyboard.dismiss();
    setExitDialogOpen(true);
    return true;
  }, [isDirty, isLoggedIn, isSubmitting]);

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

      return () => {
        subscription.remove();
      };
    }, [handleBackPress])
  );

  const handleDiscard = React.useCallback(() => {
    setExitDialogOpen(false);
    router.back();
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const nextTitle = title.trim();
    const nextContentText = contentText.trim();
    const nextContentHtml = contentHtml.trim();

    if (!nextTitle) {
      showAlert('제목을 입력해주세요.');
      return;
    }

    if (!nextContentText || !nextContentHtml) {
      showAlert('본문을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: nextTitle,
        content: nextContentHtml,
        contentPreview: buildContentPreview(nextContentText),
        published: true,
        communityCategory: mapBoardOptionToCategory(category),
      };

      const nextBoard =
        isEditMode && editingBoardUUID
          ? await updateBoard(editingBoardUUID, requestBody)
          : await createBoard(requestBody);

      setExitDialogOpen(false);
      router.replace(`/posts/${nextBoard.uuid}`);
    } catch {
      showAlert(isEditMode ? '게시글 수정 실패' : '게시글 작성 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [category, contentHtml, contentText, editingBoardUUID, isEditMode, title, user]);

  const handleLoginPress = React.useCallback(() => {
    router.push('/login');
  }, []);

  if (isInitializing || (isEditMode && isPrefillLoading)) {
    return (
      <LoadingView
        topInset={insets.top}
        bottomInset={insets.bottom}
        message={isEditMode ? '게시글을 불러오고 있습니다.' : '사용자 정보를 확인하고 있습니다.'}
      />
    );
  }

  if (prefillErrorMessage) {
    return (
      <ErrorView
        topInset={insets.top}
        bottomInset={insets.bottom}
        message={prefillErrorMessage}
        onConfirm={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }

          router.replace('/');
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4">
        <Pressable
          onPress={handleBackPress}
          className="flex-row items-center gap-1 self-start"
          accessibilityRole="button"
          accessibilityLabel="이전"
        >
          <ArrowLeftIcon className="text-black" />
          <Text className="text-body03 text-black">이전</Text>
        </Pressable>
      </View>

      {isLoggedIn ? (
        <WriteForm
          isEditMode={isEditMode}
          title={title}
          contentHtml={contentHtml}
          category={category}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          editorRef={editorRef}
          onTitleChange={setTitle}
          onContentChange={({ html, text }) => {
            setContentHtml(html);
            setContentText(text);
          }}
          onCategoryChange={setCategory}
          onSubmit={handleSubmit}
          bottomInset={insets.bottom}
        />
      ) : (
        <LoggedOutView bottomInset={insets.bottom} onLoginPress={handleLoginPress} />
      )}

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
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-grey-10"
            >
              <Text className="text-body06 text-black">취소</Text>
            </Pressable>

            <Pressable
              onPress={handleDiscard}
              className="h-[36px] flex-1 items-center justify-center rounded-xl bg-error"
            >
              <Text className="text-body06 text-white">그만하기</Text>
            </Pressable>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}

function LoadingView({
  topInset,
  bottomInset,
  message,
}: {
  topInset: number;
  bottomInset: number;
  message: string;
}) {
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topInset }}>
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator />
        <Text className="text-body05 text-grey-40">{message}</Text>
      </View>
      <View style={{ paddingBottom: bottomInset }}>
        <Footer />
      </View>
    </View>
  );
}

function ErrorView({
  topInset,
  bottomInset,
  message,
  onConfirm,
}: {
  topInset: number;
  bottomInset: number;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: topInset }}>
      <View className="flex-1 items-center justify-center gap-4 px-4">
        <Text className="text-center text-body04 text-black">{message}</Text>
        <Button onPress={onConfirm} className="rounded-xl px-5">
          <Text>확인</Text>
        </Button>
      </View>
      <View style={{ paddingBottom: bottomInset }}>
        <Footer />
      </View>
    </View>
  );
}

function WriteForm({
  isEditMode,
  title,
  contentHtml,
  category,
  canSubmit,
  isSubmitting,
  editorRef,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onSubmit,
  bottomInset,
}: WriteFormProps) {
  const { isKeyboardUp } = useKeyboard();
  const previousKeyboardStateRef = React.useRef(false);

  React.useEffect(() => {
    if (previousKeyboardStateRef.current && !isKeyboardUp) {
      editorRef.current?.blur();
    }

    previousKeyboardStateRef.current = isKeyboardUp;
  }, [editorRef, isKeyboardUp]);

  return (
    <View className="flex-1 bg-white">
      <View
        className="flex-1 px-4 pt-8"
        style={{ paddingBottom: isKeyboardUp ? 16 : bottomInset + 64 }}
      >
        <View className="gap-3.5">
          <Input
            value={title}
            onChangeText={onTitleChange}
            placeholder="제목"
            className="h-[40px] rounded-xl border-grey-10 bg-white px-3 text-body03 text-black"
            maxLength={100}
          />

          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-[40px] w-full rounded-xl border-grey-10 bg-white px-3">
              <SelectValue placeholder="게시판을 선택하세요" className="text-body03 text-blue-20" />
            </SelectTrigger>
            <SelectContent>
              {BOARD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label} />
              ))}
            </SelectContent>
          </Select>
        </View>

        <View className="mt-3.5 h-[360px] overflow-hidden rounded-xl border border-grey-10 bg-white">
          <PostEditor ref={editorRef} initialHtml={contentHtml} onChange={onContentChange} />
        </View>
      </View>

      {!isKeyboardUp ? (
        <View className="px-4 pb-4" style={{ paddingBottom: bottomInset || 16 }}>
          <Button
            variant={canSubmit ? 'default' : 'muted'}
            disabled={!canSubmit || isSubmitting}
            onPress={onSubmit}
            className={cn('h-[40px] rounded-xl', canSubmit ? 'bg-blue-35' : 'bg-grey-02')}
          >
            <Text className={cn('text-body05', canSubmit ? 'text-white' : 'text-grey-40')}>
              {isSubmitting ? (isEditMode ? '수정 중...' : '작성 중...') : '완료'}
            </Text>
          </Button>
        </View>
      ) : null}
    </View>
  );
}

function LoggedOutView({ bottomInset, onLoginPress }: LoggedOutViewProps) {
  return (
    <View className="flex-1 justify-between bg-white">
      <View className="flex-1 items-center justify-center px-4 pb-16">
        <InfoOutlineIcon size={24} className="text-grey-20" />
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

function mapBoardOptionToCategory(category: Option): Exclude<CommunityCategory, 'ALL'> {
  const value = category?.value as BoardOptionValue | undefined;
  return value === 'free' ? 'FREE' : 'NOTICE';
}

function getBoardOptionFromCategory(category?: CommunityCategory | null): BoardOption {
  return category === 'FREE' ? BOARD_OPTIONS[1] : DEFAULT_BOARD_OPTION;
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
}
