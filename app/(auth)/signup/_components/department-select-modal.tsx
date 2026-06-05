import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react-native';
import { FlatList, Modal, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Option = { label: string; value: string };

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function DepartmentSelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="h-screen w-screen bg-bg">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View className="rounded-t-2xl bg-white px-4 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-title02 text-grey-80">{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text className="text-body04 text-primary">닫기</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const selected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  className={cn(
                    'flex-row items-center justify-between rounded-lg px-3 py-3.5',
                    selected && 'bg-primary/10'
                  )}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <Text
                    className={cn(
                      'text-body05 text-grey-80',
                      selected && 'font-medium text-primary'
                    )}
                  >
                    {item.label}
                  </Text>
                  {selected && <Check size={18} className="text-primary" />}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}
