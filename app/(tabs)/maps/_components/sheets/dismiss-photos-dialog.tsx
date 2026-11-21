import { Text } from '@/components/ui/text';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PhotoDismissReason } from '@/lib/maps/dismissed-place-photos';
import { TouchableOpacity, View } from 'react-native';

const REASONS: { reason: PhotoDismissReason; label: string }[] = [
  { reason: 'place-gone', label: '지금은 없어진 가게예요' },
  { reason: 'not-this-place', label: '이 가게 사진이 아니에요' },
];

// "여기서 찍은 내 사진" 제안의 X를 누르면 숨기는 이유를 고른다. 어느 쪽이든 이 사진들은 이 장소 제안과 다녀온 곳 핀에서 빠진다
export default function DismissPhotosDialog({
  open,
  onOpenChange,
  onDismiss,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: (reason: PhotoDismissReason) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[320px] max-w-[320px] gap-4 rounded-[12px] border-2 border-grey-02 bg-white p-5"
        showCloseButton={false}
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-center text-grey-80 text-body04">
            이 사진들을 숨길까요?
          </DialogTitle>
          <DialogDescription className="text-center text-grey-80 text-caption02">
            다시 제안하지 않아요. 사진첩의 사진은 그대로 있어요.
          </DialogDescription>
        </DialogHeader>
        <View className="gap-2">
          {REASONS.map(({ reason, label }) => (
            <TouchableOpacity
              key={reason}
              onPress={() => onDismiss(reason)}
              className="h-[40px] items-center justify-center rounded-[8px] bg-grey-02"
              accessibilityRole="button"
            >
              <Text className="text-grey-80 text-body05">{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => onOpenChange(false)}
            className="h-[40px] items-center justify-center rounded-[8px] border border-grey-10 bg-white"
            accessibilityRole="button"
          >
            <Text className="text-grey-40 text-body05">취소</Text>
          </TouchableOpacity>
        </View>
      </DialogContent>
    </Dialog>
  );
}
