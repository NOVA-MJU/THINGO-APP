import {
  createKeywordAlarm,
  deleteKeywordAlarm,
  getKeywordAlarms,
  getRecommendedKeywords,
  updateKeywordAlarmCategories,
  type AlarmCategory,
  type KeywordAlarm,
} from '@/api/notifications';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getApiErrorMessage } from '@/lib/api-error';
import { showAlert } from '@/lib/alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategorySelector } from './_components/category-selector';
import { KeywordEditModal } from './_components/keyword-edit-modal';
import { KeywordItem } from './_components/keyword-item';

const KEYWORD_ALARMS_QUERY_KEY = ['keyword-alarms'] as const;
const RECOMMENDED_KEYWORDS_QUERY_KEY = ['keyword-alarms', 'recommended'] as const;
const KEYWORD_PATTERN = /^\S{1,5}$/;

export default function KeywordAlarmsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = React.useState('');
  const [categories, setCategories] = React.useState<AlarmCategory[]>([]);
  const [editingAlarm, setEditingAlarm] = React.useState<KeywordAlarm | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<KeywordAlarm | null>(null);
  const normalizedKeyword = keyword.trim();
  const isValidKeyword = KEYWORD_PATTERN.test(normalizedKeyword);

  const alarmsQuery = useQuery({
    queryKey: KEYWORD_ALARMS_QUERY_KEY,
    queryFn: getKeywordAlarms,
  });
  const recommendedQuery = useQuery({
    queryKey: RECOMMENDED_KEYWORDS_QUERY_KEY,
    queryFn: getRecommendedKeywords,
    staleTime: 1000 * 60 * 60,
  });

  const createMutation = useMutation({
    mutationFn: createKeywordAlarm,
    onSuccess: async () => {
      setKeyword('');
      setCategories([]);
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
    onError: (error) => {
      showAlert('키워드 등록 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nextCategories }: { id: number; nextCategories: AlarmCategory[] }) =>
      updateKeywordAlarmCategories(id, nextCategories),
    onSuccess: async () => {
      setEditingAlarm(null);
      await queryClient.invalidateQueries({ queryKey: KEYWORD_ALARMS_QUERY_KEY });
    },
    onError: (error) => {
      showAlert('카테고리 수정 실패', getApiErrorMessage(error, '잠시 후 다시 시도해 주세요.'));
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

  function requestKeywordRegistration() {
    if (!isValidKeyword) {
      showAlert('알림', '공백 없이 1~5글자의 키워드를 입력해 주세요.');
      return;
    }
    if (categories.length === 0) {
      showAlert('알림', '알림을 받을 카테고리를 1개 이상 선택해 주세요.');
      return;
    }

    createMutation.mutate({ keyword: normalizedKeyword, categories });
  }

  function requestRecommendedKeywordRegistration(recommendedKeyword: string) {
    const nextKeyword = recommendedKeyword.slice(0, 5);
    setKeyword(nextKeyword);

    if (categories.length === 0) {
      showAlert('알림', '알림을 받을 카테고리를 1개 이상 선택해 주세요.');
      return;
    }

    createMutation.mutate({ keyword: nextKeyword, categories });
  }

  const alarms = alarmsQuery.data ?? [];
  const recommendedKeywordRows = React.useMemo(() => {
    const keywords = recommendedQuery.data ?? [];
    const rows: string[][] = [];

    for (let index = 0; index < keywords.length; index += 3) {
      rows.push(keywords.slice(index, index + 3));
    }

    return rows;
  }, [recommendedQuery.data]);

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top }}>
        <AppHeader title="키워드 알림 설정" />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-4 pb-10 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-2">
          <Input
            className="h-11 flex-1"
            placeholder="알림 받을 키워드를 입력하세요"
            value={keyword}
            onChangeText={setKeyword}
            maxLength={5}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={requestKeywordRegistration}
            aria-invalid={keyword.length > 0 && !isValidKeyword}
          />
          <Button
            className="h-11 px-5"
            onPress={requestKeywordRegistration}
            disabled={!isValidKeyword || categories.length === 0 || createMutation.isPending}
          >
            <Text>{createMutation.isPending ? '등록 중' : '등록'}</Text>
          </Button>
        </View>
        <Text
          className={
            keyword.length > 0 && !isValidKeyword
              ? 'mt-1 text-caption02 text-error'
              : 'mt-1 text-caption02 text-grey-40'
          }
        >
          공백 없이 1~5글자
        </Text>

        <View className="mt-5">
          <CategorySelector value={categories} onChange={setCategories} />
        </View>

        <View className="mt-7">
          <Text className="text-body04 text-grey-80">추천 키워드</Text>
          {recommendedQuery.isLoading ? (
            <ActivityIndicator className="mt-4 self-start" />
          ) : recommendedQuery.isError ? (
            <Pressable onPress={() => recommendedQuery.refetch()} className="mt-2 self-start py-2">
              <Text className="text-body05 text-grey-40">추천 키워드를 불러오지 못했어요. 다시 시도</Text>
            </Pressable>
          ) : (
            <View className="mt-2 gap-2">
              {recommendedKeywordRows.map((row, rowIndex) => (
                <View key={`recommended-row-${rowIndex}`} className="flex-row gap-2">
                  {row.map((item) => (
                    <View
                      key={item}
                      className="h-11 min-w-0 flex-1 basis-0 flex-row items-center rounded-lg border border-grey-10 bg-grey-02 pl-3 pr-1.5"
                    >
                      <Text className="flex-1 text-center text-body05 text-grey-80">{item}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${item} 키워드 등록`}
                        onPress={() => requestRecommendedKeywordRegistration(item)}
                        className="h-7 items-center justify-center rounded-md bg-grey-10 px-2 active:opacity-70"
                      >
                        <Text className="text-caption02 text-grey-60">등록</Text>
                      </Pressable>
                    </View>
                  ))}
                  {Array.from({ length: 3 - row.length }, (_, index) => (
                    <View
                      key={`recommended-placeholder-${index}`}
                      className="min-w-0 flex-1 basis-0"
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mt-9 flex-row items-end justify-between">
          <Text className="text-title03 text-black">등록한 키워드</Text>
          {!alarmsQuery.isLoading && (
            <Text className="text-caption02 text-grey-40">{alarms.length}개</Text>
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
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-body04 text-grey-60">키워드를 등록하고</Text>
            <Text className="mt-1 text-body05 text-grey-40">
              원하는 소식을 가장 먼저 확인하세요
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {alarms.map((alarm) => (
              <KeywordItem
                key={alarm.id}
                alarm={alarm}
                deleting={deleteMutation.isPending && deleteTarget?.id === alarm.id}
                onEdit={() => setEditingAlarm(alarm)}
                onDelete={() => setDeleteTarget(alarm)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <KeywordEditModal
        alarm={editingAlarm}
        saving={updateMutation.isPending}
        deleting={deleteMutation.isPending}
        onClose={() => setEditingAlarm(null)}
        onSave={(nextCategories) => {
          if (!editingAlarm) return;
          updateMutation.mutate({ id: editingAlarm.id, nextCategories });
        }}
        onDelete={(alarm) => {
          setEditingAlarm(null);
          setDeleteTarget(alarm);
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>키워드를 삭제할까요?</DialogTitle>
            <DialogDescription>
              ‘{deleteTarget?.keyword}’에 대한 새 알림을 더 이상 받을 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-row">
            <Button
              variant="muted"
              className="flex-1"
              onPress={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              <Text>취소</Text>
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
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
