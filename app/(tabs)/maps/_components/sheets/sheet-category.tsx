import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import CATEGORIES from '../../_constants/category-data';

interface CategoryListSheetProps {
  onChipPress?: (chipId: string) => void;
}

export default function CategoryListSheet({ onChipPress }: CategoryListSheetProps) {
  return (
    <ScrollView>
      <View className="gap-2">
        {CATEGORIES.map((category) => (
          <View key={category.id} className="px-4 pb-2">
            {/* 카테고리 이름 */}
            <Text className="text-body02 text-black">{category.label}</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {category.chips.map((chip) => {
                return (
                  <TouchableOpacity
                    key={chip.id}
                    onPress={() => onChipPress?.(chip.id)}
                    className="flex-row items-center gap-0.5 rounded-full border border-white bg-white py-1.5 pe-2 ps-1.5"
                    style={{
                      shadowColor: '#17171B',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <chip.Icon size={20} className={category.iconClassName} />
                    <Text className="text-caption02 text-grey-80">{chip.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
