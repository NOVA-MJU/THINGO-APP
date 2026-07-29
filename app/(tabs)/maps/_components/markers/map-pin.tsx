import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { View } from 'react-native';

interface MapPinMarkerProps {
  Icon?: ComponentType<{ size?: number; className?: string }>;
  label?: string;
}

export default function MapPinMarker({ Icon, label }: MapPinMarkerProps) {
  return (
    <View
      collapsable={false}
      className="h-6 w-6 items-center justify-center rounded-full bg-blue-35"
    >
      {Icon ? (
        <Icon size={16} className="text-white" />
      ) : (
        <Text className="text-caption03 text-white">{label}</Text>
      )}
    </View>
  );
}
