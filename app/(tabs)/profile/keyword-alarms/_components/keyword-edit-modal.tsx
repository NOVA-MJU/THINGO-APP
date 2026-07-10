import type { AlarmCategory, KeywordAlarm } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Info, Trash2, X } from 'lucide-react-native';
import * as React from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategorySelector } from './category-selector';

type KeywordEditModalProps = {
  alarm: KeywordAlarm | null;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onSave: (categories: AlarmCategory[]) => void;
  onDelete: (alarm: KeywordAlarm) => void;
};

export function KeywordEditModal({
  alarm,
  saving,
  deleting,
  onClose,
  onSave,
  onDelete,
}: KeywordEditModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const sheetTranslateY = React.useRef(new Animated.Value(windowHeight)).current;
  const [categories, setCategories] = React.useState<AlarmCategory[]>([]);
  const [showCategoryError, setShowCategoryError] = React.useState(false);

  React.useEffect(() => {
    setCategories(alarm?.categories ?? []);
    setShowCategoryError(false);
  }, [alarm]);

  React.useLayoutEffect(() => {
    if (!alarm) return;

    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(windowHeight);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [alarm, backdropOpacity, sheetTranslateY, windowHeight]);

  const hasCategoryChanges = React.useMemo(() => {
    const initialCategories = alarm?.categories ?? [];
    if (initialCategories.length !== categories.length) return true;

    return initialCategories.some((category) => !categories.includes(category));
  }, [alarm?.categories, categories]);

  const canSave = categories.length > 0 && hasCategoryChanges && !saving && !deleting;

  const handlePanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !saving && !deleting,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !saving &&
          !deleting &&
          gestureState.dy > 4 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          sheetTranslateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose = gestureState.dy > 100 || gestureState.vy > 0.8;

          if (shouldClose) {
            Animated.parallel([
              Animated.timing(sheetTranslateY, {
                toValue: windowHeight,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: false,
              }),
              Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]).start(({ finished }) => {
              if (finished) onClose();
            });
            return;
          }

          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 240,
            mass: 0.8,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            damping: 20,
            stiffness: 240,
            mass: 0.8,
            useNativeDriver: false,
          }).start();
        },
      }),
    [backdropOpacity, deleting, onClose, saving, sheetTranslateY, windowHeight]
  );

  function changeCategories(nextCategories: AlarmCategory[]) {
    setCategories(nextCategories);
    if (nextCategories.length > 0) setShowCategoryError(false);
  }

  function saveCategories() {
    if (!canSave) return;
    onSave(categories);
  }

  return (
    <Modal visible={!!alarm} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(0, 0, 0, 0.4)', opacity: backdropOpacity },
          ]}
        />
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="키워드 수정 닫기" />
        <Animated.View
          style={[
            { width: '100%', transform: [{ translateY: sheetTranslateY }] },
            Platform.OS === 'web' && {
              alignSelf: 'center',
              maxWidth: 600,
            },
          ]}
        >
          <View
            className="w-full rounded-t-[20px] border border-grey-10 bg-white pt-4"
            style={{
              paddingBottom:
                Platform.OS === 'web'
                  ? 20
                  : Platform.OS === 'android'
                    ? Math.max(insets.bottom, 20)
                    : Math.max(insets.bottom, 40),
              shadowColor: '#17171B',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.14,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View
              {...handlePanResponder.panHandlers}
              accessibilityRole="button"
              accessibilityLabel="아래로 끌어 키워드 수정 닫기"
              className="-mt-4 h-8 items-center justify-center web:cursor-grab web:select-none"
            >
              <View className="h-1 w-10 rounded-full bg-grey-10" />
            </View>

            <View className="h-[43px] flex-row items-start px-4">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${alarm?.keyword ?? ''} 키워드 삭제`}
                onPress={() => alarm && onDelete(alarm)}
                disabled={saving || deleting}
                className="h-[27px] w-[52px] items-center justify-center active:opacity-70"
              >
                <Icon as={Trash2} size={24} className="text-grey-30" />
              </Pressable>
              <View className="h-[27px] flex-1 items-center justify-center">
                <Text className="text-title03 text-black">키워드 수정</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="키워드 수정 닫기"
                onPress={onClose}
                disabled={saving || deleting}
                className="h-[27px] w-[52px] items-center justify-center active:opacity-70"
              >
                <Icon as={X} size={24} className="text-grey-30" />
              </Pressable>
            </View>

            <View className="h-1 bg-grey-02" />

            <View className="px-4 pt-4">
              <Text className="font-weight-600 text-body02 text-grey-80">키워드</Text>
              <View className="mt-4 h-11 justify-center rounded-[8px] border border-grey-20 bg-white px-3">
                <Text className="text-body05 text-grey-80" numberOfLines={1}>
                  {alarm?.keyword ?? ''}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center gap-1">
                <View className="items-center justify-center rounded-full bg-grey-20">
                  <Icon as={Info} size={14} className="text-white" />
                </View>
                <Text className="flex-1 text-caption04 text-grey-40">
                  키워드는 삭제 후 다시 등록할 수 있어요.
                </Text>
              </View>
            </View>

            <View className="mt-4 px-4">
              <CategorySelector
                value={categories}
                onChange={changeCategories}
                onReset={() => changeCategories(alarm?.categories ?? [])}
                variant="sheet"
              />
              {showCategoryError && (
                <Text className="mt-2 text-caption02 text-error">
                  알림을 받을 카테고리를 1개 이상 선택해 주세요.
                </Text>
              )}
            </View>

            <Button
              className="mx-4 mt-5 h-[36px] rounded-[8px]"
              variant={canSave ? 'default' : 'secondary'}
              onPress={saveCategories}
              disabled={!canSave}
            >
              <Text
                style={
                  Platform.OS === 'android'
                    ? {
                        includeFontPadding: false,
                        transform: [{ translateY: -1 }],
                      }
                    : undefined
                }
              >
                {saving ? '저장 중' : '저장'}
              </Text>
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
