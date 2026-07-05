import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface Props {
  id: string;
}

export default function BuildingMarker({ id }: Props) {
  return (
    <View
      collapsable={false}
      className="h-6 w-6 items-center justify-center rounded-full bg-blue-20"
    >
      <Text className="text-caption03 text-white">{id}</Text>
    </View>
  );
}
