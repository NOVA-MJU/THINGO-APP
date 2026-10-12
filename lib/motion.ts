import { FadeIn, FadeInDown } from 'react-native-reanimated';

// 응답이 빨라도 화면이 툭 바뀌면 끊겨 보여서, 내용이 바뀌는 자리에는 짧은 페이드를 공통으로 쓴다.
// 기기의 동작 줄이기 설정은 Reanimated 기본값(ReduceMotion.System)이 그대로 따른다
export const contentFadeIn = FadeIn.duration(200);

// 목록 항목은 위에서부터 차례로 살짝 올라오며 나타난다. 긴 목록이 늦게 뜨지 않도록 앞쪽 몇 개만 지연을 준다
const MAX_STAGGERED_ITEMS = 6;
const STAGGER_MS = 40;

export function listItemEnter(index: number) {
  return FadeInDown.duration(220).delay(Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_MS);
}
