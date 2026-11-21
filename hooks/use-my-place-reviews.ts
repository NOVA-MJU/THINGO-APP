import { useAuth } from '@/context/auth-context';
import { getMyPlaceReviews } from '@/lib/maps/place-reviews';
import { useQuery } from '@tanstack/react-query';

// 내가 쓴 리뷰 전체 (서버 GET /reviews/me). 지도 "내가 리뷰한 곳" 파란 핀과 장소 상세의 내 리뷰 맨 위 표시가 같은 캐시를 쓴다.
// 리뷰를 쓰고·고치고·지우면 refreshMyPhotoSuggestions(hooks/use-visited-places.ts)가 같이 다시 불러온다
export const MY_PLACE_REVIEWS_QUERY_KEY = ['my-place-reviews'] as const;

export function useMyPlaceReviews() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: [...MY_PLACE_REVIEWS_QUERY_KEY, user?.uuid],
    queryFn: getMyPlaceReviews,
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
  return user ? (query.data ?? []) : [];
}
