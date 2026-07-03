import { Stack } from 'expo-router';
import { MapSearchSelectionProvider } from '@/context/map-search-selection';

export default function MapsLayout() {
  return (
    <MapSearchSelectionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="search/index" options={{ animation: 'none' }} />
      </Stack>
    </MapSearchSelectionProvider>
  );
}
