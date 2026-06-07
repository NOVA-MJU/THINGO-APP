import { getProfileStats, type ProfileStats } from '@/api/members';
import { useAuth } from '@/context/auth-context';
import { DEPARTMENT_OPTIONS } from '@/lib/departments';
import { Footer } from '@/components/footer';
import { ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS_URL =
  'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e80b08328edd8519b0b4e?source=copy_link';
const PRIVACY_URL =
  'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e807d9738dc14def5de24?source=copy_link';
const CONTACT_MAIL = `mailto:mjsearch2025@gmail.com?subject=${encodeURIComponent('문의 내용을 작성해주세요')}&body=${encodeURIComponent('안녕하세요,\n\n문의사항을 아래에 작성해주세요.\n\n- 이름:\n- 연락처:\n- 문의 내용:')}`;

async function openContactMail() {
  const supported = await Linking.canOpenURL(CONTACT_MAIL);
  if (!supported) {
    Alert.alert('알림', 'mail 앱이 설치되어있지 않습니다.');
    return;
  }
  try {
    await Linking.openURL(CONTACT_MAIL);
  } catch {
    Alert.alert('알림', 'mail 앱이 설치되어있지 않습니다.');
  }
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const departmentLabel = DEPARTMENT_OPTIONS.flatMap((c) => c.departments).find(
    (d) => d.value === user?.departmentName
  )?.label;

  // 프로필 통계 조회
  useEffect(() => {
    getProfileStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <ScrollView
      className="bg-grey-02"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
    >
      <View className="flex-1">
        <View className="px-4 pb-6 pt-5">
          <Text className="text-title01 text-black">마이페이지</Text>
          <Text className="mt-5 text-title03 text-grey-80">프로필</Text>
          <View className="mt-3 gap-5 rounded-xl bg-white p-6">
            <View className="flex-row gap-4">
              <Image
                source={user?.profileImageUrl ? { uri: user.profileImageUrl } : undefined}
                className="aspect-square w-[88px] rounded-xl border border-grey-10"
              />
              <View className="gap-0.5">
                <Text className="text-caption01 text-black">{user?.nickname}</Text>
                <Text className="text-caption01 text-black">{departmentLabel}</Text>
                <Text className="text-caption02 text-black">{user?.studentNumber}</Text>
                <Text className="text-caption02 text-grey-60">{user?.email}</Text>
              </View>
            </View>
            <Button onPress={() => router.push('/profile/edit')}>
              <Text>프로필 수정</Text>
            </Button>
          </View>
          <Text className="mt-10 text-title03 text-grey-80">나의 활동</Text>
          <TouchableOpacity
            className="mt-3 flex-row items-center gap-6 rounded-xl bg-white p-6"
            onPress={() => router.push('/profile/maps')}
          >
            <Text className="flex-1 text-body04 text-grey-80">명지도 즐겨찾기</Text>
            <Text className="text-body04 text-grey-40">- 개</Text>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-3 flex-row items-center gap-6 rounded-xl bg-white p-6"
            onPress={() => router.push('/profile/posts')}
          >
            <Text className="flex-1 text-body04 text-grey-80">내가 작성한 게시물</Text>
            <Text className="text-body04 text-grey-40">{stats?.postCount ?? '-'}개</Text>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-3 flex-row items-center gap-6 rounded-xl bg-white p-6"
            onPress={() => router.push('/profile/comments')}
          >
            <Text className="flex-1 text-body04 text-grey-80">내가 작성한 댓글</Text>
            <Text className="text-body04 text-grey-40">{stats?.commentCount ?? '-'}개</Text>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-3 flex-row items-center gap-6 rounded-xl bg-white p-6"
            onPress={() => router.push('/profile/liked-posts')}
          >
            <Text className="flex-1 text-body04 text-grey-80">찜한 글</Text>
            <Text className="text-body04 text-grey-40">{stats?.likedPostCount ?? '-'}개</Text>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
          <Text className="mt-10 text-title03 text-grey-80">정보</Text>
          <View className="mt-3 rounded-xl bg-white px-5">
            <TouchableOpacity className="flex-row items-center justify-between border-b border-grey-02 py-3">
              <Text className="text-body06 text-black">커뮤니티 이용 규칙</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between border-b border-grey-02 py-3"
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              <Text className="text-body06 text-black">서비스 이용 약관</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between border-b border-grey-02 py-3"
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              <Text className="text-body06 text-black">개인정보 처리 방침</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={openContactMail}
            >
              <Text className="text-body06 text-black">1:1 문의</Text>
              <ArrowRightIcon size={20} className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {/* 로그아웃 버튼 */}
          <Button className="mt-5" variant="outline" onPress={logout}>
            <Text>로그아웃</Text>
          </Button>

          {/* 회원 탈퇴 버튼 */}
          <TouchableOpacity
            className="mt-6 self-start"
            hitSlop={12}
            onPress={() => router.push('/profile/delete-account')}
          >
            <Text className="text-body05 text-grey-30">탈퇴하기</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
    </ScrollView>
  );
}
