import { getMealRatings, rateMeal, type MenuCategory } from '@/api/menus';
import { StarIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { showAlert } from '@/lib/alert';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SCORES = [1, 2, 3, 4, 5];

// 다른 사람이 남긴 평점이 화면에 반영되는 주기
// ponytail: 30초 폴링. 평점이 몰리는 식사 시간에 더 즉각적이어야 하면 STOMP 구독으로 바꾼다
const LIVE_REFRESH_MS = 30_000;

type Props = {
  // yyyy-MM-dd
  date: string;
  category: MenuCategory;
  // 서버가 오늘 끼니만 받으므로 오늘 날짜 카드에서만 별점 입력을 보여준다
  canRate: boolean;
};

// 누른 별까지 왼쪽부터 차례로 통통 튀며 채워진다. 동작 줄이기 설정이면 튀지 않는다
function RatingStar({
  score,
  filled,
  popKey,
  disabled,
  onPress,
}: {
  score: number;
  filled: boolean;
  popKey: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (popKey === 0 || !filled || reduceMotion) return;
    scale.value = withDelay(
      (score - 1) * 50,
      withSequence(
        withTiming(1.3, { duration: 110 }),
        withSpring(1, { damping: 7, stiffness: 260 })
      )
    );
  }, [popKey, filled, score, reduceMotion, scale]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`${score}점`}
      accessibilityState={{ selected: filled }}
    >
      <Animated.View style={style}>
        <StarIcon size={30} className={filled ? 'text-star' : 'text-grey-10'} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MealRating({ date, category, canRate }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  // 서버 응답 전에 누른 점수를 먼저 보여주고, 실패하면 되돌린다
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);

  // 같은 날짜의 조/중/석 카드가 queryKey를 공유해 요청은 한 번만 나간다
  const { data } = useQuery({
    queryKey: ['meal-ratings', date, user?.uuid ?? null],
    queryFn: () => getMealRatings(date),
    select: (ratings) => ratings.find((r) => r.menuCategory === category),
    refetchInterval: canRate ? LIVE_REFRESH_MS : false,
  });

  const { mutate: rate, isPending } = useMutation({
    mutationFn: (score: number) => rateMeal(category, score),
    onSuccess: (ratings) => {
      queryClient.setQueryData(['meal-ratings', date, user?.uuid ?? null], ratings);
      setPendingScore(null);
    },
    onError: (error) => {
      setPendingScore(null);
      showAlert('평점 등록 실패', getApiErrorMessage(error, '평점을 남기지 못했어요'));
    },
  });

  function handleRate(score: number) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    setPendingScore(score);
    setPopKey((k) => k + 1);
    rate(score);
  }

  const count = data?.count ?? 0;
  const myScore = pendingScore ?? data?.myScore ?? 0;

  return (
    <View className="gap-2 border-t border-grey-02 pt-3">
      {count > 0 ? (
        <View className="flex-row items-center gap-1">
          <StarIcon size={18} className="text-star" />
          <Text className="text-black text-body02">{data?.average.toFixed(1)}</Text>
          <Text className="text-grey-40 text-caption02">({count})</Text>
        </View>
      ) : (
        <Text className={canRate ? 'text-grey-80 text-body06' : 'text-grey-40 text-caption02'}>
          {canRate ? '첫 별점의 주인공이 되어보세요' : '평점이 없어요'}
        </Text>
      )}

      {canRate && (
        <View className="flex-row items-center gap-2">
          {(count > 0 || myScore > 0) && (
            <Animated.View key={myScore > 0 ? 'mine' : 'ask'} entering={FadeIn.duration(200)}>
              <Text className="text-grey-60 text-caption02">
                {myScore > 0 ? '내 평점' : '오늘 메뉴 어땠나요?'}
              </Text>
            </Animated.View>
          )}
          <View className="flex-row gap-1">
            {SCORES.map((score) => (
              <RatingStar
                key={score}
                score={score}
                filled={score <= myScore}
                popKey={popKey}
                disabled={isPending}
                onPress={() => handleRate(score)}
              />
            ))}
          </View>
          {myScore > 0 && (
            <Animated.View key={myScore} entering={FadeIn.duration(200)}>
              <Text className="text-black text-body04">{myScore}점</Text>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
}
