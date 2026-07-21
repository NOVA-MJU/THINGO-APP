import { Text } from '@/components/ui/text';
import type { ComponentType } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface MapPinMarkerProps {
  Icon?: ComponentType<{ size?: number; className?: string }>;
  label?: string;
  selected?: boolean;
}

export default function MapPinMarker({ Icon, label, selected = false }: MapPinMarkerProps) {
  if (selected) {
    return (
      <View collapsable={false} className="h-[50px] w-[37px] items-center">
        <Svg width={37} height={50} viewBox="0 0 37 50" fill="none">
          <Path
            d="M18.5 0C8.28273 0 0 8.28273 0 18.5C0 28.7173 8.28273 37 18.5 37C20.145 37 21.7401 36.7853 23.2588 36.3822L18.5 50L13.7412 36.3822C15.2599 36.7853 16.855 37 18.5 37C28.7173 37 37 28.7173 37 18.5C37 8.28273 28.7173 0 18.5 0Z"
            fill="#2F8CFF"
          />
        </Svg>
        <View className="absolute top-0 h-[37px] w-[37px] items-center justify-center">
          {Icon ? (
            <Icon size={22} className="text-white" />
          ) : (
            <Text className="text-caption01 text-white">{label}</Text>
          )}
        </View>
      </View>
    );
  }

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
