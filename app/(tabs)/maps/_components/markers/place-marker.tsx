import { ComponentType } from 'react';
import MapPinMarker from './map-pin';

interface Props {
  Icon: ComponentType<{ size?: number; className?: string }>;
  selected?: boolean;
}

export default function PlaceMarker({ Icon, selected = false }: Props) {
  return <MapPinMarker Icon={Icon} selected={selected} />;
}
