import { ComponentType } from 'react';
import { View } from 'react-native';

interface Props {
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export default function PlaceMarker({ Icon }: Props) {
  return (
    <View
      collapsable={false}
      className="h-8 w-8 items-center justify-center rounded-full bg-blue-35"
    >
      <Icon size={20} className="text-white" />
    </View>
  );
}
