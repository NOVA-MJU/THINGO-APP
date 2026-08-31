import { getProfileStats, type ProfileStats } from '@/api/members';
import { useAuth } from '@/context/auth-context';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { Footer } from '@/components/footer';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { openContactMail } from '@/lib/contact';
import { openLink } from '@/lib/open-link';
import { showConfirm } from '@/lib/alert';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS_URL = 'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e80b08328edd8519b0b4e';
const LOCATION_PRIVACY_URL =
  'https://verbena-ixia-597.notion.site/Thingo-39722ef5d21e802ebf0edfe83047fa8f';
const PRIVACY_URL = 'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e807d9738dc14def5de24';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const departmentLabel = DEPARTMENT_OPTIONS.flatMap((c) => c.departments).find(
    (d) => d.value === user?.departmentName
  )?.label;

  // 프로필 화면으로 돌아올 때마다 최신 정보 조회
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      getProfileStats()
        .then((nextStats) => {
          if (isActive) setStats(nextStats);
        })
        .catch(() => {});

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <ScrollView
      className="bg-grey-02"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
    >
      <View className="mb-10 flex-1">
        <View className="px-4 pt-5">
          <Text className="text-black text-title01">마이페이지</Text>

          {/* 내 프로필 */}
          <Text className="mt-4 text-grey-80 text-title03">프로필</Text>
          <View className="mt-2 gap-5 rounded-xl bg-white p-4">
            <View className="flex-row gap-4">
              {user?.profileImageUrl ? (
                <Image
                  source={{ uri: user.profileImageUrl }}
                  className="aspect-square w-[88px] rounded-xl border border-grey-10"
                />
              ) : (
                <View className="aspect-square w-[88px] items-center justify-center rounded-xl border border-grey-10 bg-grey-02">
                  <Text className="text-grey-30 text-caption02">이미지 없음</Text>
                </View>
              )}
              <View className="gap-0.5">
                <Text className="text-black text-caption01">{user?.nickname}</Text>
                <Text className="text-black text-caption01">{departmentLabel}</Text>
                <Text className="text-black text-caption02">{user?.studentNumber}</Text>
                <Text className="text-grey-60 text-caption02">{user?.email}</Text>
              </View>
            </View>
            <Button onPress={() => router.push('/profile/edit')}>
              <Text>프로필 수정</Text>
            </Button>
          </View>

          {/* 나의 활동 */}
          <Text className="mt-4 text-grey-80 text-title03">나의 활동</Text>
          <View className="mt-2 gap-3">
            {/* TODO: app/(tabs)/profile/maps 라우트가 아직 없어 타입 단언으로 막아둠 */}
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/maps' as never)}
            >
              <Text className="flex-1 text-grey-80 text-body04">명지도 즐겨찾기</Text>
              <Text className="text-grey-40 text-body04">{stats?.mapFavoriteCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/posts')}
            >
              <Text className="flex-1 text-grey-80 text-body04">내가 작성한 게시물</Text>
              <Text className="text-grey-40 text-body04">{stats?.postCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/comments')}
            >
              <Text className="flex-1 text-grey-80 text-body04">내가 작성한 댓글</Text>
              <Text className="text-grey-40 text-body04">{stats?.commentCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/liked-posts')}
            >
              <Text className="flex-1 text-grey-80 text-body04">찜한 글</Text>
              <Text className="text-grey-40 text-body04">{stats?.likedPostCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/keyword-alarms')}
            >
              <Text className="flex-1 text-grey-80 text-body04">키워드 알림 설정</Text>
              <Text className="text-grey-40 text-body04">{stats?.keywordAlarmCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-4 rounded-xl bg-white px-4 py-6"
              onPress={() => router.push('/profile/blocked-users')}
            >
              <Text className="flex-1 text-grey-80 text-body04">차단한 사용자</Text>
              <Text className="text-grey-40 text-body04">{stats?.blockedUserCount ?? '-'}개</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {/* 정보 */}
          <Text className="mt-4 text-grey-80 text-title03">정보</Text>
          <View className="mt-2 rounded-xl bg-white px-4">
            <TouchableOpacity
              className="flex-row items-center justify-between border-b border-grey-02 py-3"
              onPress={() => openLink(TERMS_URL)}
            >
              <Text className="text-black text-body06">Thingo 서비스 이용 약관</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between border-b border-grey-02 py-3"
              onPress={() => openLink(LOCATION_PRIVACY_URL)}
            >
              <Text className="text-black text-body06">위치기반 서비스 이용 약관</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between border-b border-grey-02 py-3"
              onPress={() => openLink(PRIVACY_URL)}
            >
              <Text className="text-black text-body06">개인정보 처리 방침</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={openContactMail}
            >
              <Text className="text-black text-body06">1:1 문의</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {/* 로그아웃 버튼 */}
          <Button
            className="mt-4"
            variant="outline"
            onPress={() => showConfirm('로그아웃 하시겠습니까?', undefined, logout)}
          >
            <Text>로그아웃</Text>
          </Button>

          {/* 회원 탈퇴 버튼 */}
          <TouchableOpacity
            className="mt-6 self-start"
            hitSlop={12}
            onPress={() => router.push('/profile/delete-account')}
          >
            <Text className="text-grey-30 text-body05">탈퇴하기</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}
