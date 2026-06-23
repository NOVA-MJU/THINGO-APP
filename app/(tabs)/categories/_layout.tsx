import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function CategoriesLayout() {
  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
