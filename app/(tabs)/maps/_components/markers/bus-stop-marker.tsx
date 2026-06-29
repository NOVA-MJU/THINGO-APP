import BusIcon from '@/app/(tabs)/maps/_components/icons/bus';
import { View } from 'react-native';

export default function BusStopMarker() {
  return (
    <View
      collapsable={false}
      className="h-8 w-8 items-center justify-center rounded-full bg-blue-20"
    >
      <BusIcon size={20} className="text-white" />
    </View>
  );
}
