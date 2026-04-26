import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import clsx from 'clsx';
import { ScrollView, View } from 'react-native';

type Props = {
  tabs: string[];
  currentTab: string;
  onTabPress: (index: number) => void;
};

export function TabBar({ tabs, currentTab, onTabPress }: Props) {
  return (
    <View className="border-b border-grey-20">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}>
        {tabs.map((label, index) => (
          <Button
            key={label}
            variant="ghost"
            className={clsx(
              'rounded-none px-5 pb-2 pt-2.5',
              currentTab === label && 'border-b-2 border-mju-primary'
            )}
            onPress={() => onTabPress(index)}>
            <Text
              className={`${currentTab === label ? 'text-body04 text-mju-primary' : 'text-body06 text-grey-40'}`}>
              {label}
            </Text>
          </Button>
        ))}
      </ScrollView>
    </View>
  );
}
