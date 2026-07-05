import { useAuth } from '@/context/auth-context';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLinkIcon, LoginIcon, XThinIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = 249;

const NAV_SECTIONS = [
  {
    title: 'Information',
    items: [
      { label: '명지도', href: '/maps' },
      { label: '공지사항', href: null, tabIndex: 4 },
      { label: '학사일정', href: null, tabIndex: 5 },
      { label: '학식', href: null, tabIndex: 1 },
      { label: '명대신문', href: null, tabIndex: 6 },
      { label: '명대뉴스', href: null, tabIndex: 7 },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: '정보게시판', href: null, tabIndex: 2 },
      { label: '자유게시판', href: null, tabIndex: 2 },
    ],
  },
  {
    title: 'My',
    items: [
      { label: '마이페이지', href: '/profile', tabIndex: null },
      { label: 'SSO', href: 'https://portal.mju.ac.kr', isExternal: true, tabIndex: null },
    ],
  },
];

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (tabIndex: number) => void;
}

export default function Sidebar({ visible, onClose, onNavigate }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  /**
   * auth-context에서 사용자 정보와 로그아웃 함수를 가져옴
   */
  const { user, logout } = useAuth();

  const slideAnim = useSharedValue(SIDEBAR_WIDTH);
  const fadeAnim = useSharedValue(0);
  const [modalVisible, setModalVisible] = React.useState(visible);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
      fadeAnim.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    }
  }, [visible, slideAnim, fadeAnim]);

  function handleClose() {
    const config = { duration: 220, easing: Easing.in(Easing.cubic) };
    slideAnim.value = withTiming(SIDEBAR_WIDTH, config);
    fadeAnim.value = withTiming(0, config, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(setModalVisible)(false);
        runOnJS(onClose)();
      }
    });
  }

  // 로그인 버튼 클릭
  function handleLogin() {
    handleClose();
    router.push('/login');
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
        style={[{ flex: 1, paddingTop: Platform.OS === 'ios' ? insets.top : 0 }, fadeStyle]}
      >
        <Pressable className="flex-1 bg-bg" onPress={handleClose} />
      </Animated.View>

      {/* 사이드바 패널 */}
      <Animated.View style={[{ position: 'absolute', right: 0 }, slideStyle]}>
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
                          if (item.tabIndex != null) {
                            handleClose();
                            onNavigate?.(item.tabIndex);
                          } else if (item.href) {
                            if ('isExternal' in item && item.isExternal) {
                              Linking.openURL(item.href);
                            } else {
                              handleClose();
                              router.push(item.href as never);
                            }
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
