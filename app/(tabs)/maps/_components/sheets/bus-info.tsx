import { Text } from '@/components/ui/text';
import { fetchBusArrivals, toggleBusFavorite } from '@/lib/maps/bus-arrivals';
import type { BusStopStation } from '@/lib/maps/bus-stops';
import { useAuth } from '@/context/auth-context';
import { useLoginRequiredModal } from '@/context/login-required-modal-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { BusIcon, FavoriteIcon } from '@/components/icons/map';
import { XIcon } from '@/components/icons';

interface Props {
  station: BusStopStation;
  onClose?: () => void;
}

const CONGESTION_STYLE: Record<string, { containerClassName: string; textClassName: string }> = {
  여유: { containerClassName: 'bg-blue-05', textClassName: 'text-blue-35' },
  보통: { containerClassName: 'bg-[#EDAE26]/20', textClassName: 'text-[#EDAE26]' },
  혼잡: { containerClassName: 'bg-[#F45353]/20', textClassName: 'text-error' },
  매우혼잡: { containerClassName: 'bg-[#F45353]/20', textClassName: 'text-error' },
};

// "8분 36초", "3분", "30초" → 초 단위 숫자. "곧 도착"은 null
function parseRemainingSeconds(time: string): number | null {
  if (time === '곧 도착') return null;
  const m = time.match(/(\d+)분/);
  const s = time.match(/(\d+)초/);
  if (!m && !s) return null;
  return (m ? parseInt(m[1], 10) * 60 : 0) + (s ? parseInt(s[1], 10) : 0);
}

function formatSeconds(total: number): string {
  if (total <= 0) return '곧 도착';
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m === 0 ? `${s}초` : `${m}분 ${s}초`;
}

export default function BusInfoSheet({ station, onClose }: Props) {
  const { user } = useAuth();
  const { showLoginRequiredModal } = useLoginRequiredModal();
  const queryClient = useQueryClient();
  const fetchedAtRef = React.useRef<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  const { data, isPending, isError, dataUpdatedAt } = useQuery({
    queryKey: ['bus-arrivals', station],
    queryFn: () => fetchBusArrivals(station),
    refetchInterval: 30_000,
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: (routeName: string) => toggleBusFavorite(station, routeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bus-arrivals', station] });
    },
  });

  // 서버 데이터가 갱신될 때마다 기준 시각 리셋
  React.useEffect(() => {
    if (!dataUpdatedAt) return;
    fetchedAtRef.current = dataUpdatedAt;
    setElapsedSeconds(0);
  }, [dataUpdatedAt]);

  // 1초마다 경과 시간 갱신
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - fetchedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleFavoritePress(routeName: string) {
    if (!user) {
      showLoginRequiredModal();
      return;
    }
    toggleFavorite(routeName);
  }

  if (isPending) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="items-center py-8">
        <Text className="text-body05 text-grey-40">버스 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="gap-3.5 px-4">
        {/* 헤더 */}
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-title03 text-black">{data.stationName}</Text>
          <TouchableOpacity
            hitSlop={4}
            onPress={onClose}
            className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
          >
            <XIcon size={14} className="text-grey-30" />
          </TouchableOpacity>
        </View>

        {/* 버스 목록 */}
        {data.buses.map((bus, i) => (
          <View key={bus.routeName}>
            {/* 버스 행 */}
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity onPress={() => handleFavoritePress(bus.routeName)} hitSlop={4}>
                <FavoriteIcon size={28} active={bus.favorite} />
              </TouchableOpacity>
              <View className="flex-1 flex-row items-center gap-2">
                <BusIcon size={24} className="text-blue-20" />
                <View>
                  <Text className="text-body02 text-black">{bus.routeName}</Text>
                  <Text className="text-caption04 text-grey-30">막차 {bus.lastBusTime}</Text>
                </View>

                <View className="ml-auto items-end gap-0.5">
                  {bus.arrivals.length === 0 ? (
                    <Text className="text-caption01 text-grey-40">도착 예정 정보 없음</Text>
                  ) : (
                    bus.arrivals.map((arrival, j) => {
                      const parsed = parseRemainingSeconds(arrival.remainingTime);
                      const displayTime =
                        parsed === null ? '곧 도착' : formatSeconds(parsed - elapsedSeconds);
                      const congestionStyle = arrival.congestion
                        ? CONGESTION_STYLE[arrival.congestion]
                        : null;

                      return (
                        <View key={j} className="flex-row items-center gap-2">
                          <Text className="text-caption01 text-blue-35">{displayTime}</Text>
                          {arrival.stationCount && (
                            <Text className="text-caption02 text-grey-30">
                              {arrival.stationCount} 전
                            </Text>
                          )}
                          {congestionStyle && (
                            <View className={`rounded px-1 ${congestionStyle.containerClassName}`}>
                              <Text className={`text-caption05 ${congestionStyle.textClassName}`}>
                                {arrival.congestion}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </View>

            {i < data.buses.length - 1 && <View className="mt-3.5 h-[1.5px] bg-grey-02" />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
