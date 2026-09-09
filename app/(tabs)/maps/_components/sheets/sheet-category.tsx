import { XIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import CATEGORIES from '../../_constants/category-data';

interface CategoryListSheetProps {
  onChipPress?: (chipId: string) => void;
  onClose?: () => void;
}

// 카테고리 칩 목록 표시 시트 (base 위에 스택 레이어로 뜨므로 다른 스택 시트들과 동일하게 닫기 버튼을 둔다)
export default function CategoryListSheet({ onChipPress, onClose }: CategoryListSheetProps) {
  return (
    <ScrollView>
      <View className="flex-row justify-end px-4">
        <TouchableOpacity
          hitSlop={4}
          onPress={onClose}
          className="h-7 w-7 items-center justify-center rounded-full bg-grey-02"
        >
          <XIcon size={14} className="text-grey-30" />
        </TouchableOpacity>
      </View>
      <View className="gap-2">
        {CATEGORIES.map((category) => (
          <View key={category.id} className="px-4 pb-2">
            {/* 카테고리 이름 */}
            <Text className="text-black text-body02">{category.label}</Text>
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
                    <Text className="text-grey-80 text-caption02">{chip.label}</Text>
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
