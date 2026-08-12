import {
  createKeywordAlarm,
  deleteKeywordAlarm,
  getKeywordAlarms,
  getRecommendedKeywords,
  updateKeywordAlarm,
  updateKeywordAlarmEnabled,
  type AlarmCategory,
  type KeywordAlarm,
} from '@/api/notifications';
import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { getApiErrorMessage } from '@/lib/api-error';
import { showAlert } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Info, Plus } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CategorySelector from './_components/category-selector';
import KeywordEditModal from './_components/keyword-edit-modal';
import KeywordItem from './_components/keyword-item';

const KEYWORD_ALARMS_QUERY_KEY = ['keyword-alarms'] as const;
const RECOMMENDED_KEYWORDS_QUERY_KEY = ['keyword-alarms', 'recommended'] as const;
const KEYWORD_PATTERN = /^\S{2,5}$/;
const MAX_KEYWORD_ALARMS = 10;
const DEFAULT_RECOMMENDED_KEYWORDS = [
  '중간고사',
  '기말고사',
  '해외탐방',
  '해외봉사',
  '수강신청',
  '졸업유예',
];
const BROAD_KEYWORDS = new Set(['안내', '운영', '신청', '공고', '채용', '모집', '명지대학교']);

type ConfirmKeyword = {
  keyword: string;
  categories: AlarmCategory[];
} | null;

export default function KeywordAlarmsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const [keyword, setKeyword] = React.useState('');
  const [categories, setCategories] = React.useState<AlarmCategory[]>([]);
  const [editingAlarm, setEditingAlarm] = React.useState<KeywordAlarm | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<KeywordAlarm | null>(null);
  const [confirmKeyword, setConfirmKeyword] = React.useState<ConfirmKeyword>(null);

  const normalizedKeyword = keyword.replace(/\s+/g, '');
  const isValidKeyword = KEYWORD_PATTERN.test(normalizedKeyword);
  const isKeywordInvalid = keyword.length > 0 && !isValidKeyword;
  const showCategories = isValidKeyword;

  const alarmsQuery = useQuery({
    queryKey: KEYWORD_ALARMS_QUERY_KEY,
    queryFn: getKeywordAlarms,
  });
  const recommendedQuery = useQuery({
    queryKey: RECOMMENDED_KEYWORDS_QUERY_KEY,
    queryFn: getRecommendedKeywords,
    staleTime: 1000 * 60 * 60,
  });

  const alarms = React.useMemo(() => {
    return [...(alarmsQuery.data ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [alarmsQuery.data]);

  const recommendedKeywords =
    recommendedQuery.data && recommendedQuery.data.length > 0
      ? recommendedQuery.data.slice(0, 6)
      : DEFAULT_RECOMMENDED_KEYWORDS;

  const createMutation = useMutation({
    mutationFn: createKeywordAlarm,
    onSuccess: async () => {
      setKeyword('');
      setCategories([]);
      setConfirmKeyword(null);
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
    onError: (error) => {
      showAlert('키워드 등록 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      nextKeyword,
      nextCategories,
    }: {
      id: number;
      nextKeyword: string;
      nextCategories: AlarmCategory[];
    }) => updateKeywordAlarm(id, { keyword: nextKeyword, categories: nextCategories }),
    onSuccess: async () => {
      setEditingAlarm(null);
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
    onError: (error) => {
      showAlert('키워드 수정 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKeywordAlarm,
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
    onError: (error) => {
      showAlert('키워드 삭제 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
  });

  const updateEnabledMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      updateKeywordAlarmEnabled(id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });

      const previousAlarms = queryClient.getQueryData<KeywordAlarm[]>(KEYWORD_ALARMS_QUERY_KEY);

      queryClient.setQueryData<KeywordAlarm[]>(KEYWORD_ALARMS_QUERY_KEY, (current) =>
        current?.map((alarm) => (alarm.id === id ? { ...alarm, enabled } : alarm))
      );

      return { previousAlarms };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(KEYWORD_ALARMS_QUERY_KEY, context?.previousAlarms);
      showAlert('알림 설정 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
    onSuccess: (updatedAlarm) => {
      queryClient.setQueryData<KeywordAlarm[]>(KEYWORD_ALARMS_QUERY_KEY, (current) =>
        current?.map((alarm) => (alarm.id === updatedAlarm.id ? updatedAlarm : alarm))
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
  });

  function validateBeforeCreate(nextKeyword: string, nextCategories: AlarmCategory[]) {
    if (!user) {
      showLoginRequiredModal();
      return false;
    }
    if (alarms.length >= MAX_KEYWORD_ALARMS) {
      showAlert('알림', `키워드는 최대 ${MAX_KEYWORD_ALARMS}개까지 등록할 수 있어요.`);
      return false;
    }
    if (!KEYWORD_PATTERN.test(nextKeyword)) {
      showAlert('알림', '공백 제외 2글자 이상 입력해주세요.');
      return false;
    }
    if (nextCategories.length === 0) {
      showAlert('알림', '알림을 받을 카테고리를 1개 이상 선택해 주세요.');
      return false;
    }

    return true;
  }

  function createAlarm(nextKeyword: string, nextCategories: AlarmCategory[], confirmed = false) {
    if (!validateBeforeCreate(nextKeyword, nextCategories)) return;
    if (!confirmed && BROAD_KEYWORDS.has(nextKeyword)) {
      setConfirmKeyword({ keyword: nextKeyword, categories: nextCategories });
      return;
    }

    createMutation.mutate({ keyword: nextKeyword, categories: nextCategories });
  }

  function requestKeywordRegistration() {
    createAlarm(normalizedKeyword, categories);
  }

  function handleRecommendedKeywordPress(recommendedKeyword: string) {
    const nextKeyword = recommendedKeyword.replace(/\s+/g, '').slice(0, 5);

    if (normalizedKeyword === nextKeyword) {
      setKeyword('');
      return;
    }

    setKeyword(nextKeyword);

    if (categories.length > 0) {
      createAlarm(nextKeyword, categories);
    }
  }

  function toggleAlarmEnabled(alarm: KeywordAlarm) {
    updateEnabledMutation.mutate({ id: alarm.id, enabled: !alarm.enabled });
  }

  const androidTextAdjust =
    Platform.OS === 'android'
      ? { includeFontPadding: false, transform: [{ translateY: -1 }] }
      : undefined;

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="키워드 알림 설정" />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pb-10 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-2">
          <Input
            className="h-[34px] flex-1"
            placeholder="알림 받을 키워드를 입력하세요."
            value={keyword}
            onChangeText={setKeyword}
            maxLength={10}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={requestKeywordRegistration}
            aria-invalid={isKeywordInvalid}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="키워드 등록"
            onPress={requestKeywordRegistration}
            disabled={!isValidKeyword || createMutation.isPending}
            className={cn(
              'h-[34px] w-[56px] items-center justify-center rounded-[8px] active:opacity-80',
              isValidKeyword && !createMutation.isPending ? 'bg-blue-35' : 'bg-grey-30'
            )}
          >
            <Text className="text-body05 text-white" style={androidTextAdjust}>
              {createMutation.isPending ? '등록 중' : '등록'}
            </Text>
          </Pressable>
        </View>
        <View className="mt-2 flex-row items-center gap-1">
          <View
            className={
              isKeywordInvalid
                ? 'items-center justify-center rounded-full bg-error'
                : 'items-center justify-center rounded-full bg-grey-20'
            }
          >
            <Icon as={Info} size={14} className="text-white" />
          </View>
          <Text
            className={
              isKeywordInvalid ? 'text-caption04 text-error' : 'text-caption04 text-grey-30'
            }
          >
            {isKeywordInvalid
              ? '올바른 형식의 키워드를 입력해주세요.'
              : '공백 제외 2글자 이상 입력해주세요.'}
          </Text>
        </View>

        {showCategories && (
          <View className="mt-5">
            <CategorySelector
              value={categories}
              onChange={setCategories}
              onReset={() => setCategories([])}
            />
          </View>
        )}

        <View className="mt-5">
          <Text className="text-body04 text-black">추천 키워드</Text>
          {recommendedQuery.isLoading && recommendedKeywords.length === 0 ? (
            <ActivityIndicator className="mt-4 self-start" />
          ) : (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {recommendedKeywords.map((item) => {
                const selected = normalizedKeyword === item.replace(/\s+/g, '').slice(0, 5);

                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`${item} 키워드 선택`}
                    onPress={() => handleRecommendedKeywordPress(item)}
                    className={cn(
                      'h-[30px] flex-row items-center gap-1 rounded-full border px-3 active:opacity-70',
                      selected ? 'border-blue-15 bg-blue-05' : 'border-grey-10 bg-white'
                    )}
                  >
                    <Text className={cn('text-body05', selected ? 'text-blue-35' : 'text-grey-40')}>
                      {item}
                    </Text>
                    <Icon
                      as={selected ? Check : Plus}
                      size={15}
                      className={selected ? 'text-blue-35' : 'text-grey-40'}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {alarmsQuery.isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator />
          </View>
        ) : alarmsQuery.isError ? (
          <View className="items-center py-16">
            <Text className="text-body05 text-grey-60">키워드 목록을 불러오지 못했어요.</Text>
            <Button variant="outline" className="mt-4" onPress={() => alarmsQuery.refetch()}>
              <Text>다시 시도</Text>
            </Button>
          </View>
        ) : alarms.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-16 pt-36">
            <Text className="text-center text-body05 text-grey-30">키워드를 등록하고</Text>
            <Text className="mt-1 text-center text-body05 text-grey-30">
              원하는 소식 가장 먼저 확인하세요
            </Text>
          </View>
        ) : (
          <View className="mt-5">
            <Text className="text-title03 text-black">
              총 {alarms.length}
              <Text className="text-title03 text-grey-40">/{MAX_KEYWORD_ALARMS}</Text>
            </Text>
            <View className="mt-2">
              {alarms.map((alarm) => (
                <KeywordItem
                  key={alarm.id}
                  alarm={alarm}
                  disabled={updateEnabledMutation.isPending}
                  onEdit={() => setEditingAlarm(alarm)}
                  onToggleEnabled={() => toggleAlarmEnabled(alarm)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <KeywordEditModal
        alarm={editingAlarm}
        saving={updateMutation.isPending}
        deleting={deleteMutation.isPending}
        onClose={() => setEditingAlarm(null)}
        onSave={(nextKeyword, nextCategories) => {
          if (!editingAlarm) return;
          updateMutation.mutate({
            id: editingAlarm.id,
            nextKeyword,
            nextCategories,
          });
        }}
        onDelete={(alarm) => {
          setEditingAlarm(null);
          setDeleteTarget(alarm);
        }}
      />

      <Dialog open={!!confirmKeyword} onOpenChange={(open) => !open && setConfirmKeyword(null)}>
        <DialogContent className="max-w-[320px] gap-4 rounded-[12px] p-5" showCloseButton={false}>
          <DialogHeader className="gap-1">
            <DialogTitle className="text-center text-body04 text-grey-80">
              현재 키워드는 많은 알림이 발생할 수 있습니다.
            </DialogTitle>
            <DialogDescription className="text-center text-caption02 text-grey-80">
              더 정확한 검색을 위해 키워드를 구체적으로 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="h-9 flex-row gap-2">
            <Button
              variant="outline"
              className="h-9 flex-1"
              onPress={() => {
                if (!confirmKeyword) return;
                createAlarm(confirmKeyword.keyword, confirmKeyword.categories, true);
              }}
              disabled={createMutation.isPending}
            >
              <Text>등록</Text>
            </Button>
            <Button
              className="h-9 flex-1"
              onPress={() => setConfirmKeyword(null)}
              disabled={createMutation.isPending}
            >
              <Text>재입력</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent
          className="h-[113px] max-w-[320px] gap-4 rounded-[12px] border-2 border-grey-02 p-5"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-body04 text-black">
              ‘{deleteTarget?.keyword}’ 키워드를 삭제하시겠습니까?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="h-[36px] flex-row gap-4">
            <Button
              variant="outline"
              className="h-[36px] flex-1 rounded-[8px]"
              onPress={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              <Text>취소</Text>
            </Button>
            <Button
              className="h-[36px] flex-1 rounded-[8px]"
              onPress={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              <Text>{deleteMutation.isPending ? '삭제 중' : '삭제'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
