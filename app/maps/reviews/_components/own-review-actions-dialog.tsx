import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { type LucideIcon, PencilLine, Trash2 } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

// 리뷰 사진 스토리에서 내 리뷰의 ⋯를 눌렀을 때 뜨는 수정·삭제 창.
// 장소 상세의 리뷰 메뉴(place-community-section.tsx)와 같은 문구·색이고, 스토리 위에서 누르기 쉽게 한 줄 48px로 둔다
export default function OwnReviewActionsDialog({
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[300px] max-w-[300px] gap-3 rounded-[14px] border-2 border-grey-02 bg-white p-4"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-grey-80 text-body04">내 리뷰</DialogTitle>
        </DialogHeader>
        <View className="gap-1">
          <ActionRow label="수정하기" icon={PencilLine} onPress={onEdit} />
          <ActionRow label="삭제하기" icon={Trash2} destructive onPress={onDelete} />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onOpenChange(false)}
          className="h-11 items-center justify-center rounded-xl border border-grey-10 bg-white"
        >
          <Text className="text-grey-60 text-body04">취소</Text>
        </TouchableOpacity>
      </DialogContent>
    </Dialog>
  );
}

function ActionRow({
  label,
  icon,
  destructive = false,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={onPress}
      className="h-12 flex-row items-center gap-3 rounded-xl bg-grey-02 px-4"
    >
      <Icon as={icon} size={18} className={destructive ? 'text-error' : 'text-grey-60'} />
      <Text className={cn('text-body04', destructive ? 'text-error' : 'text-grey-80')}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
