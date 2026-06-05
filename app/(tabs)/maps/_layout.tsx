import { Stack } from 'expo-router';

export default function MapsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search/index" options={{ animation: 'none' }} />
    </Stack>
  );
}
