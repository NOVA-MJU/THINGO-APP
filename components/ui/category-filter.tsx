import { Text } from '@/components/ui/text';
import clsx from 'clsx';
import { Pressable, ScrollView, View } from 'react-native';

type Props = {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  paddingHorizontal?: number;
};

export function CategoryFilter({ categories, selected, onSelect, paddingHorizontal = 12 }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal }}>
      {categories.map((label) => (
        <Pressable key={label} onPress={() => onSelect(label)} className="p-1">
          <View
            className={clsx(
              'rounded-full px-3 py-1.5',
              selected === label ? 'bg-mju-primary' : 'border border-grey-10 bg-white'
            )}>
            <Text
              className={clsx(
                selected === label ? 'text-body04 text-white' : 'text-body05 text-grey-40'
              )}>
              {label}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
