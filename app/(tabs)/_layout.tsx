import BottomNavigation from '@/components/bottom-navigation';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <BottomNavigation />}>
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="maps" />
      <Tabs.Screen name="category" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="(auth)" />
    </Tabs>
  );
}
