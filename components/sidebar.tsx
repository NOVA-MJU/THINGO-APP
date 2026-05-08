import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLinkIcon, LoginIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    title: 'Information',
    items: [
      { label: '학과별 정보', href: null },
      { label: '명지도', href: null },
      { label: '공지사항', href: null },
      { label: '학사일정', href: null },
      { label: '학식', href: null },
      { label: '명대신문', href: null },
      { label: '명대뉴스', href: null },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: '정보게시판', href: null },
      { label: '자유게시판', href: null },
      { label: '멘토관 서비스', href: null },
    ],
  },
  {
    title: 'My',
    items: [
      { label: '마이페이지', href: null },
      { label: 'SSO', href: 'external', isExternal: true },
    ],
  },
] as const;

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogin() {
    onClose();
    router.push('/(auth)/login');
  }

  async function handleLogout() {
    onClose();
    await logout();
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* background 오버레이 */}
      <Pressable className="flex-1 bg-bg" onPress={onClose} />

      {/* 사이드바 패널 */}
      <View
        style={{
          position: 'absolute',
          right: 0,
        }}
      >
        <View
          style={{ paddingTop: insets.top + 16, gap: 8 }}
          className="h-screen w-[249px] bg-white"
        >
          {/* 닫기 버튼 */}
          <View className="items-end px-4">
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <XThinIcon className="text-grey-30" />
            </TouchableOpacity>
          </View>

          {/* 로그인/회원가입 버튼 */}
          {!user && (
            <View className="px-5">
              <TouchableOpacity onPress={handleLogin}>
                <View className="flex-row items-center gap-1 self-start rounded-[4px] border border-grey-20 py-1 pe-2 ps-1">
                  <LoginIcon className="text-mju-primary" />
                  <Text className="text-caption02 text-black">로그인/회원가입</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 프로필 영역 */}
          {user && (
            <>
              <View className="flex-row items-center gap-3 px-5">
                {user.profileImageUrl ? (
                  <Image
                    source={{ uri: user.profileImageUrl }}
                    className="aspect-square w-10 rounded-full bg-grey-10"
                  />
                ) : (
                  <View className="aspect-square w-10 rounded-full bg-grey-10" />
                )}
                <View className="flex-1">
                  <Text className="text-body02 text-black">{user.nickname}</Text>
                  <Text className="text-body05 text-grey-30">{user.studentNumber}</Text>
                </View>
              </View>
              <View className="h-[1px] w-full bg-grey-02" />
            </>
          )}

          {/* 네비게이션 */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            contentContainerClassName="gap-2"
          >
            {NAV_SECTIONS.map((section, index) => (
              <View key={index} className="gap-2">
                <View>
                  <View className="px-5 py-[9px]">
                    <Text className="text-body02 text-blue-35">{section.title}</Text>
                  </View>
                  <View>
                    {section.items.map((item) => (
                      <TouchableOpacity key={item.label}>
                        <View className="flex-row items-center px-5 py-2.5 transition hover:bg-blue-05 hover:transition-none">
                          <Text className="text-body05 text-black">{item.label}</Text>
                          {'isExternal' in item && item.isExternal && (
                            <ExternalLinkIcon size={24} className="text-mju-primary" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {index < NAV_SECTIONS.length - 1 && <View className="h-[1px] w-full bg-grey-02" />}
              </View>
            ))}

            {/* 로그아웃 버튼 (로그인 상태일 때만) */}
            {user && (
              <View className="px-5">
                <TouchableOpacity onPress={handleLogout}>
                  <View className="flex-row items-center gap-1 self-start rounded-[4px] border border-grey-20 py-1 pe-2 ps-1">
                    <LoginIcon className="text-mju-primary" />
                    <Text className="text-caption02 text-black">로그아웃</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
