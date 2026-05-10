import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLinkIcon, LoginIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = 249;

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
      { label: '마이페이지', href: '/profile' },
      { label: 'SSO', href: 'https://portal.mju.ac.kr', isExternal: true },
    ],
  },
] as const;

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(visible);

  // 열림 애니메이션
  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // 닫기 애니메이션
  function handleClose() {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  }

  // 로그인 버튼 클릭
  function handleLogin() {
    handleClose();
    router.push('/(auth)/login');
  }

  // 로그아웃 버튼 클릭
  async function handleLogout() {
    handleClose();
    await logout();
  }

  return (
    <Modal transparent visible={modalVisible} animationType="none" onRequestClose={handleClose}>
      {/* background 오버레이 */}
      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }}
      >
        <Pressable className="flex-1 bg-bg" onPress={handleClose} />
      </Animated.View>

      {/* 사이드바 패널 */}
      <Animated.View
        style={{
          position: 'absolute',
          right: 0,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <View
          style={{ paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16, gap: 8 }}
          className="h-screen w-[249px] bg-white"
        >
          {/* 닫기 버튼 */}
          <View className="items-end px-4">
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
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
                      <TouchableOpacity
                        key={item.label}
                        onPress={() => {
                          if (!item.href) return;
                          if ('isExternal' in item && item.isExternal) {
                            Linking.openURL(item.href);
                          } else {
                            handleClose();
                            router.push(item.href as never);
                          }
                        }}
                      >
                        <View
                          className={cn(
                            'flex-row items-center px-5 py-2.5',
                            Platform.OS === 'web' &&
                              'transition hover:bg-blue-05 hover:transition-none'
                          )}
                        >
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
      </Animated.View>
    </Modal>
  );
}
