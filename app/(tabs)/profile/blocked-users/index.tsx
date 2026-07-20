import { getBlockedMembers, unblockMember, type BlockedMember } from '@/api/members';
import { AppHeader } from '@/components/app-header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { parseUTCDate } from '@/lib/utils';
import { format } from 'date-fns';
import * as React from 'react';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = React.useState<BlockedMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unblockTarget, setUnblockTarget] = React.useState<BlockedMember | null>(null);
  const [isUnblocking, setIsUnblocking] = React.useState(false);

  const loadBlockedMembers = React.useCallback(() => {
    setLoading(true);
    return getBlockedMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  // 차단한 사용자 목록 조회
  React.useEffect(() => {
    void loadBlockedMembers();
  }, [loadBlockedMembers]);

  // 차단 해제 확인 버튼 클릭
  async function handleUnblockConfirm() {
    if (!unblockTarget || isUnblocking) return;

    setIsUnblocking(true);

    try {
      await unblockMember(unblockTarget.memberUuid);
      setUnblockTarget(null);
      await loadBlockedMembers();
    } catch {
      showAlert('차단 해제 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsUnblocking(false);
    }
  }

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="차단한 사용자" />
      </View>
      <ScrollView className="flex-1 bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1">
          <View className="px-4 py-5">
            <Text className="text-title01 text-black">차단한 사용자</Text>
            <Text className="mt-1 text-body05 text-grey-40">총 {members.length}개</Text>
          </View>

          <View className="flex-1">
            {loading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator />
              </View>
            ) : members.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-body05 text-black">차단한 사용자가 없습니다.</Text>
              </View>
            ) : (
              <View className="gap-2 px-4">
                {/* 차단한 사용자 목록 */}
                {members.map((member) => (
                  <View key={member.memberUuid} className="gap-3 rounded-xl bg-white px-4 py-4">
                    <View className="flex-row items-center gap-3">
                      {member.profileImageUrl ? (
                        <Image
                          source={{ uri: member.profileImageUrl }}
                          className="aspect-square w-10 rounded-full bg-grey-10"
                        />
                      ) : (
                        <View className="aspect-square w-10 rounded-full bg-grey-10" />
                      )}
                      <View className="flex-1">
                        <Text className="text-body04 text-black">{member.nickname}</Text>
                        <Text className="mt-0.5 text-body05 text-grey-40">
                          차단일 {format(parseUTCDate(member.blockedAt), 'yyyy.MM.dd HH:mm')}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-end">
                      {/* 차단 해제 버튼 */}
                      <Button
                        variant="outline"
                        className="px-3 py-1.5"
                        onPress={() => setUnblockTarget(member)}
                      >
                        <Text className="text-caption02">차단 해제</Text>
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <Footer />
      </ScrollView>

      {/* 차단 해제 확인 창 */}
      <Dialog
        open={unblockTarget !== null}
        onOpenChange={(open) => !open && setUnblockTarget(null)}
      >
        <DialogContent showCloseButton={false} className="min-w-80 p-5">
          <View className="gap-4">
            <View>
              <DialogTitle className="text-center text-body04 leading-normal text-grey-80">
                {`'${unblockTarget?.nickname}' 차단을 해제하시겠어요?`}
              </DialogTitle>
              <Text className="text-center text-caption02 text-grey-80">
                {
                  '차단을 해제하면 이 사용자가 작성한 게시판 글과\n댓글, 명지도 리뷰가 다시 노출됩니다.'
                }
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                className="h-9 flex-1 py-0"
                variant="outline"
                onPress={() => setUnblockTarget(null)}
                disabled={isUnblocking}
              >
                <Text>취소</Text>
              </Button>
              <Button
                className="h-9 flex-1 py-0"
                onPress={() => void handleUnblockConfirm()}
                disabled={isUnblocking}
              >
                <Text>{isUnblocking ? '해제 중...' : '차단 해제'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  );
}
