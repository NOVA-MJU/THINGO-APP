import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMenus, type MenuItem } from '@/api/menu';

/**
 * 식단 데이터 캐시 유지 시간입니다.
 * 5분 동안은 같은 queryKey(["menus"])에 대해 API를 다시 호출하지 않고
 * React Query 캐시 데이터를 우선 사용합니다.
 */
const MENU_STALE_TIME_MS = 1000 * 60 * 5;

/**
 * 식단 카테고리 정렬 순서입니다.
 * API 응답 순서와 무관하게 화면에서는 아침 → 점심 → 저녁 순으로 보여주기 위함입니다.
 */
const ORDER: Array<MenuItem['menuCategory']> = ['BREAKFAST', 'LUNCH', 'DINNER'];

/**
 * 날짜 문자열에서 요일 표기를 제거합니다.
 *
 * 예:
 * "04.24(금)" -> "04.24"
 * "04.24 (금)" -> "04.24"
 */
const stripDow = (s: string) => s.replace(/\s*\([^)]*\)\s*/g, '').trim();

/**
 * 식단 데이터를 조회하고, 화면에서 사용하기 좋은 형태로 가공하는 Hook입니다.
 *
 * 책임:
 * 1. 식단 API 호출
 * 2. 로딩 / 에러 / 재요청 상태 제공
 * 3. 날짜별 그룹화
 * 4. 아침 / 점심 / 저녁 순 정렬
 * 5. 오늘 날짜에 해당하는 key 계산
 */
export function useMenuData() {
  /**
   * React Query로 식단 API를 호출합니다.
   *
   * data 기본값을 []로 둔 이유:
   * - API 응답 전에도 이후 로직에서 map, for-of 등을 안전하게 사용하기 위함
   */
  const {
    data = [],
    isLoading,
    error,
    refetch,
    isFetching,
    isError,
    status,
  } = useQuery<MenuItem[]>({
    queryKey: ['menus'],
    queryFn: getMenus,
    staleTime: MENU_STALE_TIME_MS,
    retry: 1,
  });

  useEffect(() => {
    if (!__DEV__) return;

    // console.log("[menus/hook] React Query 상태", {
    //   status,
    //   isLoading,
    //   isFetching,
    //   isError,
    //   dataCount: data.length,
    //   error,
    // });
  }, [data.length, error, isError, isFetching, isLoading, status]);

  /**
   * API 응답 데이터를 날짜별로 그룹화합니다.
   *
   * 결과 형태:
   * [
   *   ["04.24(금)", [아침 데이터, 점심 데이터, 저녁 데이터]],
   *   ["04.25(토)", [아침 데이터, 점심 데이터, 저녁 데이터]]
   * ]
   *
   * useMemo를 쓰는 이유:
   * - data가 바뀌지 않으면 불필요하게 그룹화/정렬을 다시 하지 않기 위함
   */
  const groupedByDate = useMemo(() => {
    const map = new Map<string, MenuItem[]>();

    // 1. 같은 날짜끼리 묶기
    for (const menu of data) {
      if (!map.has(menu.date)) {
        map.set(menu.date, []);
      }

      map.get(menu.date)!.push(menu);
    }

    // 2. 각 날짜 내부에서 아침 → 점심 → 저녁 순으로 정렬
    for (const [, menus] of map) {
      menus.sort((a, b) => ORDER.indexOf(a.menuCategory) - ORDER.indexOf(b.menuCategory));
    }

    // 3. 날짜 자체도 오름차순 정렬
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  /**
   * 날짜 key 목록만 추출합니다.
   *
   * 예:
   * ["04.24(금)", "04.25(토)", "04.26(일)"]
   */
  const keys = useMemo(() => groupedByDate.map(([key]) => key), [groupedByDate]);

  /**
   * 오늘 날짜에 해당하는 key를 찾습니다.
   *
   * 현재 날짜가 4월 24일이면 canonical은 "04.24"가 됩니다.
   * API 날짜가 "04.24(금)"처럼 요일을 포함할 수 있으므로
   * stripDow로 요일을 제거한 뒤 비교합니다.
   *
   * 오늘 날짜가 API 데이터에 없으면 첫 번째 날짜를 기본값으로 사용합니다.
   */
  const todayKey = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const canonical = `${mm}.${dd}`;

    return keys.find((key) => stripDow(key) === canonical) ?? keys[0] ?? '';
  }, [keys]);

  /**
   * 특정 날짜 key에 해당하는 식단 목록을 반환합니다.
   *
   * 예:
   * getByDate("04.24(금)")
   * -> [아침 데이터, 점심 데이터, 저녁 데이터]
   */
  const getByDate = (key: string) => {
    return groupedByDate.find(([date]) => date === key)?.[1] ?? [];
  };

  useEffect(() => {
    if (!__DEV__) return;

    // console.log('[menus/hook] 가공 데이터', {
    //   keys,
    //   todayKey,
    //   groupedByDateCount: groupedByDate.length,
    //   groupedByDate,
    // });
  }, [groupedByDate, keys, todayKey]);

  return {
    // 원본 API 응답 데이터
    data,

    // API 호출 중 여부
    isLoading,

    // 백그라운드 포함 API 요청 중 여부
    isFetching,

    // API 호출 실패 여부
    isError,

    // API 호출 실패 정보
    error,

    // 식단 API 수동 재요청 함수
    refetch,

    // 날짜별로 그룹화된 식단 데이터
    groupedByDate,

    // 날짜 key 목록
    keys,

    // 오늘 날짜에 해당하는 key
    todayKey,

    // 특정 날짜의 식단 조회 함수
    getByDate,
  };
}
