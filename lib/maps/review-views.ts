import { recordPlaceReviewViews } from '@/lib/maps/place-reviews';

// 리뷰 조회수(노출 수). 장소 리뷰 목록·스토리에서 리뷰가 화면에 나오면 모아 두었다가 한 번에 서버로 보낸다.
// 앱 한 번 실행하는 동안 리뷰마다 한 번만 센다 (목록을 다시 열거나 정렬을 바꿀 때마다 오르지 않게)
// ponytail: 목록에 그려지면 본 것으로 센다(스크롤해서 실제로 화면에 들어왔는지는 보지 않는다). 정확히 재려면 onViewableItemsChanged로 바꾼다
const FLUSH_DELAY_MS = 1500;

// 앱 실행 동안 하나만 있어야 하는 기록과 보낼 대기열이라 모듈 최상단에 둔다
const countedReviewIds = new Set<string>();
let pendingReviewIds: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function markReviewsViewed(reviewIds: string[]) {
  const newIds = reviewIds.filter((id) => id && !countedReviewIds.has(id));
  if (!newIds.length) return;
  newIds.forEach((id) => countedReviewIds.add(id));
  pendingReviewIds = [...pendingReviewIds, ...newIds];
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    const ids = pendingReviewIds;
    pendingReviewIds = [];
    flushTimer = null;
    // 조회수는 보조 지표라 못 보내도 화면에는 영향이 없다 (다음 실행 때 다시 센다)
    void recordPlaceReviewViews(ids).catch(() => undefined);
  }, FLUSH_DELAY_MS);
}
