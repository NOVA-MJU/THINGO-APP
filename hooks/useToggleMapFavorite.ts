import { toggleMapFavorite } from '@/api/maps';
import { useAuth } from '@/context/auth-context';
import { showAlert } from '@/lib/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 지도 건물/장소 즐겨찾기 토글 (미로그인 시 안내만 표시)
export function useToggleMapFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: (pinId: number) => toggleMapFavorite(pinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map-buildings'] });
      queryClient.invalidateQueries({ queryKey: ['map-building-detail'] });
      queryClient.invalidateQueries({ queryKey: ['map-place-detail'] });
      queryClient.invalidateQueries({ queryKey: ['map-category-pins'] });
      queryClient.invalidateQueries({ queryKey: ['map-search'] });
    },
  });

  // onToggled: react-query 캐시로 관리되지 않는 화면(예: 검색 결과 요약)에서 낙관적으로 반영할 때 사용
  return function toggleFavorite(
    pinId: number,
    options?: { onToggled?: (favorite: boolean) => void }
  ) {
    if (!user) {
      showAlert('로그인이 필요한 서비스 입니다');
      return;
    }
    mutate(pinId, { onSuccess: (favorite) => options?.onToggled?.(favorite) });
  };
}
