import { createBoard, getBoardDetail, updateBoard, type CommunityCategory } from '@/api/posts';
import { Footer } from '@/components/footer';
import { ArrowDownIcon, ArrowLeftIcon, InfoOutlineIcon } from '@/components/icons';
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
import type { Option } from '@/components/ui/select';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useImageUpload } from '@/hooks/useImageUpload';
import { showAlert } from '@/lib/alert';
import {
  buildContentPreview,
  escapeHtml,
  normalizePostContent,
  serializePostContentForStorage,
} from '@/lib/post-content';
import { cn } from '@/lib/utils';
import { useKeyboard } from '@10play/tentap-editor';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Keyboard,
  Platform,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BoardOption = NonNullable<Option>;
type BoardOptionValue = 'info' | 'free';

type WriteFormProps = {
  isEditMode: boolean;
  title: string;
  contentHtml: string;
  category: Option;
  imageUrl: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  editorRef: React.RefObject<PostEditorHandle | null>;
  onTitleChange: (value: string) => void;
  onContentChange: (value: PostEditorValue) => void;
  onCategoryChange: (value: Option) => void;
  onImageUrlChange: (value: string | null) => void;
  onSubmit: () => void;
  bottomInset: number;
  iosWebViewportHeight: number | null;
  isIOSWeb: boolean;
};

type SubmitContent = {
  preview: string;
  source: string;
  storage: string;
  text: string;
};

type LoggedOutViewProps = {
  bottomInset: number;
  onLoginPress: () => void;
};

type InitialFormState = {
  title: string;
  contentText: string;
  imageUrl: string | null;
  categoryValue: string;
};

const DEFAULT_BOARD_OPTION: BoardOption = { value: 'info', label: '정보게시판' };
const BOARD_OPTIONS: BoardOption[] = [DEFAULT_BOARD_OPTION, { value: 'free', label: '자유게시판' }];

const DEFAULT_FORM_STATE: InitialFormState = {
  title: '',
  contentText: '',
  imageUrl: null,
  categoryValue: DEFAULT_BOARD_OPTION.value,
};

const IOS_WEB_HEADER_HEIGHT = 64;
const IOS_WEB_FORM_TOP_PADDING = 24;
const IOS_WEB_FIELDS_HEIGHT = 94;
const IOS_WEB_FIELD_GAP_TOTAL = 28;
const IOS_WEB_IMAGE_PREVIEW_HEIGHT = 92;
const IOS_WEB_SUBMIT_AREA_HEIGHT = 72;
const IOS_WEB_BOTTOM_COMFORT_SPACE = 18;
const IOS_WEB_MIN_EDITOR_HEIGHT = 160;
const IOS_WEB_MAX_EDITOR_HEIGHT = 360;

export default function BoardWriteScreen() {
  const insets = useSafeAreaInsets();
  const { height: iosWebViewportHeight, isIOSWeb } = useIOSWebViewport();
  const { postId } = useLocalSearchParams<{ postId?: string | string[] }>();
  const editingBoardUUID = Array.isArray(postId) ? postId[0] : postId;
  const isEditMode = Boolean(editingBoardUUID);
  const { user, isInitializing } = useAuth();
  const editorRef = React.useRef<PostEditorHandle>(null);
  const [title, setTitle] = React.useState('');
  const [contentHtml, setContentHtml] = React.useState('');
  const [contentText, setContentText] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
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
    imageUrl !== initialFormState.imageUrl ||
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
      setImageUrl(board.imageUrl);
      setCategory(nextCategory);
      setInitialFormState({
        title: board.title.trim(),
        contentText: normalizedText,
        imageUrl: board.imageUrl,
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

    const latestContentHtml = await editorRef.current?.getHtml();
    const latestContentText = await editorRef.current?.getText();
    const nextTitle = title.trim();
    const submitContent = buildSubmitContent({
      html: latestContentHtml ?? contentHtml,
      imageUrl,
      text: latestContentText ?? contentText,
    });

    if (!nextTitle) {
      showAlert('제목을 입력해주세요.');
      return;
    }

    if (!submitContent.text || !submitContent.source) {
      showAlert('본문을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: nextTitle,
        content: submitContent.storage,
        contentPreview: submitContent.preview,
        imageUrl,
        published: true,
        communityCategory: mapBoardOptionToCategory(category),
      };

      const nextBoard =
        isEditMode && editingBoardUUID
          ? await updateBoard(editingBoardUUID, requestBody)
          : await createBoard(requestBody);

      setExitDialogOpen(false);

      if (isEditMode) {
        const nextBoardCategory = nextBoard.communityCategory === 'FREE' ? 'free' : 'info';

        router.replace(
          `/posts/${nextBoard.uuid}?fromEdit=true&boardCategory=${nextBoardCategory}&refreshPost=${Date.now()}`
        );
        return;
      }

      const nextBoardCategory = nextBoard.communityCategory === 'FREE' ? 'free' : 'info';
      router.replace(
        `/posts/${nextBoard.uuid}?fromCreate=true&boardCategory=${nextBoardCategory}&refreshPost=${Date.now()}`
      );
    } catch {
      showAlert(isEditMode ? '게시글 수정 실패' : '게시글 작성 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [category, contentHtml, contentText, editingBoardUUID, imageUrl, isEditMode, title, user]);

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
    <View
      className="flex-1 bg-white"
      style={[
        { paddingTop: insets.top },
        isIOSWeb && iosWebViewportHeight
          ? ({
              height: iosWebViewportHeight,
              maxHeight: iosWebViewportHeight,
              overflow: 'hidden',
            } as ViewStyle)
          : null,
      ]}
    >
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
          imageUrl={imageUrl}
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
          onImageUrlChange={setImageUrl}
          onSubmit={handleSubmit}
          bottomInset={insets.bottom}
          iosWebViewportHeight={iosWebViewportHeight}
          isIOSWeb={isIOSWeb}
        />
      ) : (
        <LoggedOutView bottomInset={insets.bottom} onLoginPress={handleLoginPress} />
      )}

      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="mx-6 w-[320px] max-w-[320px] gap-4 rounded-xl border-none py-[24px]">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-center text-body03 text-black">
              {isEditMode ? '게시물 수정을 중단하시겠습니까?' : '게시물 작성을 중단하시겠습니까?'}
            </DialogTitle>
            <DialogDescription className="text-center text-body06 text-grey-80">
              {isEditMode ? '변경된 내용이 저장되지 않습니다.' : '기록된 모든 내용이 삭제됩니다.'}
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
  imageUrl,
  category,
  canSubmit,
  isSubmitting,
  editorRef,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onImageUrlChange,
  onSubmit,
  bottomInset,
  iosWebViewportHeight,
  isIOSWeb,
}: WriteFormProps) {
  const { isKeyboardUp } = useKeyboard();
  const previousKeyboardStateRef = React.useRef(false);
  const iosWebBottomInset = isIOSWeb
    ? Math.max(bottomInset, IOS_WEB_BOTTOM_COMFORT_SPACE)
    : bottomInset;
  const iosWebEditorHeight = React.useMemo(() => {
    if (!isIOSWeb || !iosWebViewportHeight) return null;

    const fixedHeight =
      IOS_WEB_HEADER_HEIGHT +
      IOS_WEB_FORM_TOP_PADDING +
      IOS_WEB_FIELDS_HEIGHT +
      IOS_WEB_FIELD_GAP_TOTAL +
      IOS_WEB_IMAGE_PREVIEW_HEIGHT +
      IOS_WEB_SUBMIT_AREA_HEIGHT +
      iosWebBottomInset;
    const availableHeight = iosWebViewportHeight - fixedHeight;

    return Math.max(
      IOS_WEB_MIN_EDITOR_HEIGHT,
      Math.min(IOS_WEB_MAX_EDITOR_HEIGHT, availableHeight)
    );
  }, [iosWebBottomInset, iosWebViewportHeight, isIOSWeb]);

  React.useEffect(() => {
    if (previousKeyboardStateRef.current && !isKeyboardUp) {
      editorRef.current?.blur();
    }

    previousKeyboardStateRef.current = isKeyboardUp;
  }, [editorRef, isKeyboardUp]);

  return (
    <View
      className="flex-1 bg-white"
      style={isIOSWeb ? ({ overflow: 'hidden' } as ViewStyle) : null}
    >
      <View
        className="flex-1 px-4"
        style={{
          paddingBottom: isKeyboardUp ? 16 : isIOSWeb ? iosWebBottomInset + 12 : bottomInset + 64,
          paddingTop: isIOSWeb ? IOS_WEB_FORM_TOP_PADDING : 32,
        }}
      >
        <View className="z-20 gap-3.5">
          <Input
            value={title}
            onChangeText={onTitleChange}
            placeholder="제목"
            className="h-[40px] rounded-xl border-grey-10 bg-white px-3 text-body03 text-black"
            maxLength={100}
          />

          <BoardDropdown value={category} onChange={onCategoryChange} />
        </View>

        <View
          className={cn(
            'z-0 mt-3.5 overflow-hidden rounded-xl border border-grey-10 bg-white',
            iosWebEditorHeight ? null : 'h-[360px]'
          )}
          style={iosWebEditorHeight ? { height: iosWebEditorHeight } : null}
        >
          <PostEditor
            ref={editorRef}
            initialHtml={contentHtml}
            onChange={onContentChange}
            placeholder="내용을 입력해주세요."
          />
        </View>

        <PostImageUploadPreviewV3 imageUrl={imageUrl} onImageUrlChange={onImageUrlChange} />
      </View>

      {!isKeyboardUp ? (
        <View
          className="px-4 pb-4"
          style={{ paddingBottom: isIOSWeb ? iosWebBottomInset : bottomInset || 16 }}
        >
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

function useIOSWebViewport() {
  const [state, setState] = React.useState(() => ({
    height: null as number | null,
    isIOSWeb: false,
  }));

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;

    const userAgent = window.navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (userAgent.includes('Macintosh') && window.navigator.maxTouchPoints > 1);

    if (!isIOSDevice) return;

    const updateViewportHeight = () => {
      setState({
        height: Math.round(window.visualViewport?.height ?? window.innerHeight),
        isIOSWeb: true,
      });
    };

    updateViewportHeight();
    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('scroll', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return state;
}

function PostImageUploadPreviewV3({
  imageUrl,
  onImageUrlChange,
}: {
  imageUrl: string | null;
  onImageUrlChange: (value: string | null) => void;
}) {
  const { isLoading, error, pickAndUpload } = useImageUpload('COMMUNITY_POST');

  const handleUploadPress = React.useCallback(async () => {
    const uploadedUrl = await pickAndUpload();
    if (uploadedUrl) onImageUrlChange(uploadedUrl);
  }, [onImageUrlChange, pickAndUpload]);

  return (
    <View className="mt-3.5">
      <View className="flex-row items-center gap-3">
        <Button
          variant="muted"
          disabled={isLoading}
          onPress={handleUploadPress}
          className="h-[92px] w-[112px] rounded-xl border border-grey-10 bg-grey-02 px-2 py-0"
        >
          <Text className="text-center text-caption02 text-grey-40" numberOfLines={2}>
            {isLoading ? '업로드 중...' : '이미지 업로드'}
          </Text>
        </Button>

        <View className="relative h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-xl border border-grey-10 bg-grey-02">
          {imageUrl ? (
            <>
              <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
              <Pressable
                onPress={() => onImageUrlChange(null)}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
                accessibilityRole="button"
                accessibilityLabel="업로드 이미지 삭제"
              >
                <Text className="text-[14px] font-bold leading-[16px] text-white">X</Text>
              </Pressable>
            </>
          ) : (
            <Text className="text-caption02 text-grey-30">미리보기</Text>
          )}
        </View>
      </View>

      {error ? <Text className="mt-2 text-caption02 text-error">{error}</Text> : null}
    </View>
  );
}

export function PostImageUploadPreviewV2({
  imageUrl,
  onImageUrlChange,
}: {
  imageUrl: string | null;
  onImageUrlChange: (value: string | null) => void;
}) {
  const { isLoading, error, pickAndUpload } = useImageUpload('COMMUNITY_POST');

  const handleUploadPress = React.useCallback(async () => {
    const uploadedUrl = await pickAndUpload();
    if (uploadedUrl) onImageUrlChange(uploadedUrl);
  }, [onImageUrlChange, pickAndUpload]);

  return (
    <View className="mt-3.5">
      <View className="flex-row items-center gap-3">
        <Button
          variant="muted"
          disabled={isLoading}
          onPress={handleUploadPress}
          className="h-[92px] w-[112px] rounded-xl border border-grey-10 bg-grey-02 px-2 py-0"
        >
          <Text className="text-center text-caption02 text-grey-40" numberOfLines={2}>
            {isLoading ? '업로드 중...' : '이미지 업로드'}
          </Text>
        </Button>

        <View className="relative h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-xl border border-grey-10 bg-grey-02">
          {imageUrl ? (
            <>
              <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
              <Pressable
                onPress={() => onImageUrlChange(null)}
                className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
                accessibilityRole="button"
                accessibilityLabel="업로드 이미지 삭제"
              >
                <Text className="text-[16px] font-bold leading-[18px] text-white">×</Text>
              </Pressable>
            </>
          ) : (
            <Text className="text-caption02 text-grey-30">미리보기</Text>
          )}
        </View>
      </View>

      {error ? <Text className="mt-2 text-caption02 text-error">{error}</Text> : null}
    </View>
  );
}

type BoardDropdownProps = {
  value: Option;
  onChange: (value: Option) => void;
};

function BoardDropdown({ value, onChange }: BoardDropdownProps) {
  const [isWebMenuOpen, setIsWebMenuOpen] = React.useState(false);
  const selectedLabel =
    BOARD_OPTIONS.find((option) => option.value === value?.value)?.label ??
    DEFAULT_BOARD_OPTION.label;

  if (Platform.OS === 'web') {
    return (
      <View style={webBoardDropdownContainerStyle}>
        <Pressable
          onPress={() => setIsWebMenuOpen((previous) => !previous)}
          accessibilityRole="button"
          accessibilityLabel="게시판 선택"
          className="h-[40px] flex-row items-center rounded-xl border border-grey-10 bg-white px-3"
        >
          <Text className="flex-1 text-body03 text-blue-20" numberOfLines={1}>
            {selectedLabel}
          </Text>
          <ArrowDownIcon size={24} className="text-grey-30" />
        </Pressable>

        {isWebMenuOpen ? (
          <View style={webBoardDropdownMenuStyle}>
            {BOARD_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option);
                  setIsWebMenuOpen(false);
                }}
                style={webBoardDropdownItemStyle}
              >
                <Text className="text-body03 text-black">{option.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <View className="h-[40px] flex-row items-center rounded-xl border border-grey-10 bg-white px-3">
          <Text className="flex-1 text-body03 text-blue-20" numberOfLines={1}>
            {selectedLabel}
          </Text>
          <ArrowDownIcon size={24} className="text-grey-30" />
        </View>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {BOARD_OPTIONS.map((option) => (
          <DropdownMenu.Item key={option.value} onSelect={() => onChange(option)}>
            <DropdownMenu.ItemTitle>{option.label}</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

const webBoardDropdownContainerStyle: ViewStyle = {
  position: 'relative',
  zIndex: 100,
};

const webBoardDropdownMenuStyle: ViewStyle = {
  backgroundColor: '#FFFFFF',
  elevation: 8,
  left: 0,
  overflow: 'hidden',
  paddingBottom: 8,
  paddingTop: 8,
  position: 'absolute',
  shadowColor: '#111111',
  shadowOffset: {
    width: 0,
    height: 12,
  },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  top: 40,
  width: 200,
  zIndex: 110,
};

const webBoardDropdownItemStyle: ViewStyle = {
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  display: 'flex',
  flexDirection: 'row',
  height: 44,
  paddingLeft: 14,
  paddingRight: 14,
};

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

function appendUploadedImageToContent(contentHtml: string, imageUrl: string | null) {
  if (!imageUrl) return contentHtml;

  const escapedUrl = escapeHtml(imageUrl);
  return `${contentHtml}<figure><img src="${escapedUrl}" alt="게시글 이미지" /></figure>`;
}

function buildSubmitContent({
  html,
  imageUrl,
  text,
}: {
  html: string;
  imageUrl: string | null;
  text: string;
}): SubmitContent {
  const trimmedHtml = html.trim();
  const trimmedText = text.trim();
  const source = htmlToPlainText(trimmedHtml) ? trimmedHtml : trimmedText;
  const contentWithImage = appendUploadedImageToContent(source, imageUrl);

  return {
    preview: buildContentPreview(trimmedText),
    source,
    storage: serializePostContentForStorage(contentWithImage),
    text: trimmedText,
  };
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
