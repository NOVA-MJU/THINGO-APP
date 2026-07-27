import { changePassword, getMemberInfo, updateMemberInfo, validateNickname } from '@/api/members';
import { Footer } from '@/components/footer';
import { ArrowDownIcon, InfoCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useRouter } from 'expo-router';
import { COLLEGE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '@/lib/validation';
import { showAlert } from '@/lib/alert';
import { useState } from 'react';
import { Image, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { AppHeader } from '@/components/app-header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [selectedCollege, setSelectedCollege] = useState<string | null>(user?.college ?? null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    user?.departmentName ?? null
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checkedNickname, setCheckedNickname] = useState<string | null>(user?.nickname ?? null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    user?.profileImageUrl ?? null
  );
  const { isLoading: isUploadingImage, pickAndUpload } = useImageUpload('PROFILE_IMAGE');

  const collegeLabel = COLLEGE_OPTIONS.find((c) => c.value === selectedCollege)?.label ?? null;
  const departmentOptions =
    DEPARTMENT_OPTIONS.find((d) => d.college.value === selectedCollege)?.departments ?? [];
  const departmentLabel =
    departmentOptions.find((d) => d.value === selectedDepartment)?.label ?? null;

  const handlePickProfileImage = async () => {
    const url = await pickAndUpload();
    if (url) setProfileImageUrl(url);
  };

  const handleDeleteProfileImage = () => {
    setProfileImageUrl(null);
  };

  // 기본 정보 변경 시 저장 버튼 활성화
  const hasBasicInfoChanged =
    nickname !== (user?.nickname ?? '') ||
    selectedCollege !== (user?.college ?? null) ||
    selectedDepartment !== (user?.departmentName ?? null) ||
    profileImageUrl !== (user?.profileImageUrl ?? null);

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!PASSWORD_REGEX.test(newPassword)) return showAlert('오류', PASSWORD_MESSAGE);
    if (newPassword !== confirmPassword)
      return showAlert('오류', '새 비밀번호가 일치하지 않습니다.');
    try {
      await changePassword(currentPassword, newPassword);
      showAlert('완료', '비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showAlert('오류', '비밀번호 변경에 실패했습니다.');
    }
  };

  // 닉네임 중복 확인
  const handleCheckNickname = async () => {
    setIsCheckingNickname(true);
    try {
      await validateNickname(nickname);
      setCheckedNickname(nickname);
      showAlert('확인', '사용 가능한 닉네임입니다.');
    } catch {
      showAlert('오류', '이미 사용 중인 닉네임입니다.');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 기본 정보 저장
  const handleSave = async () => {
    if (nickname !== (user?.nickname ?? '') && checkedNickname !== nickname)
      return showAlert('알림', '닉네임 중복 확인을 해주세요.');
    if (selectedCollege && !selectedDepartment) return showAlert('알림', '학과를 선택해주세요.');
    if (!selectedCollege || !selectedDepartment) return;
    setIsSaving(true);
    try {
      const nextProfileImageUrl = profileImageUrl ?? '';

      await updateMemberInfo({
        name: user?.name ?? '',
        nickname,
        college: selectedCollege,
        departmentName: selectedDepartment,
        studentNumber: user?.studentNumber ?? '',
        profileImageUrl: nextProfileImageUrl,
      });
      const updated = await getMemberInfo();
      setUser({ ...updated, profileImageUrl });
      router.back();
    } catch {
      showAlert('오류', '정보 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-grey-02">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="프로필 수정" />
      </View>
      <ScrollView contentContainerClassName="flex-grow">
        <View className="mb-14 flex-1 px-4">
          {/* 계정 정보 */}
          <View className="mt-5 flex-row">
            <Text className="text-title01 text-black">계정 정보</Text>
            <Text className="ms-1 text-title01 text-error">*</Text>
          </View>
          <View className="mt-2 rounded-xl bg-white p-4">
            {/* 이메일 */}
            <Text className="text-body04 text-grey-80">이메일</Text>
            <View className="mt-2 rounded-lg border border-grey-10 bg-grey-02 p-3">
              <Text className="text-body06 text-grey-40">{user?.email}</Text>
            </View>
            <Text className="mt-2 text-caption02 text-grey-30">※ 이메일은 수정할 수 없습니다.</Text>

            {/* 비밀번호 변경 */}
            <Text className="mt-4 text-body04 text-grey-80">현재 비밀번호</Text>
            <Input
              className="mt-2"
              placeholder="현재 비밀번호를 입력하세요"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <Text className="mt-4 text-body04 text-grey-80">새 비밀번호</Text>
            <Input
              className="mt-2"
              placeholder="새 비밀번호를 입력하세요"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View className="mt-2 flex-row items-center gap-1">
              <InfoCircleIcon size={16} className="text-grey-30" />
              <Text className="text-caption02 text-grey-30">
                영문, 숫자, 특수문자 포함 8자 이상
              </Text>
            </View>
            <Text className="mt-4 text-body04 text-grey-80">새 비밀번호 확인</Text>
            <Input
              className="mt-2"
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleChangePassword}
              returnKeyType="done"
            />
            <Button
              className="mt-4"
              variant={currentPassword && newPassword && confirmPassword ? 'default' : 'subtle'}
              onPress={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              <Text>비밀번호 변경하기</Text>
            </Button>
          </View>

          {/* 기본 정보 */}
          <View className="mt-4 flex-row">
            <Text className="text-title01 text-black">기본 정보</Text>
            <Text className="ms-1 text-title01 text-error">*</Text>
          </View>
          <View className="mt-2 rounded-xl bg-white p-4">
            {/* 프로필 이미지 */}
            <Text className="text-body04 text-grey-80">프로필</Text>
            <View className="relative mt-2 self-start">
              <TouchableOpacity onPress={handlePickProfileImage} disabled={isUploadingImage}>
                <View className="aspect-square w-[88px] items-center justify-center overflow-hidden rounded-xl border border-grey-10">
                  {profileImageUrl ? (
                    <Image
                      source={{ uri: profileImageUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-caption02 text-grey-20">
                      {isUploadingImage ? '업로드 중...' : '이미지 업로드'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {profileImageUrl ? (
                <Pressable
                  onPress={handleDeleteProfileImage}
                  className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/70"
                  accessibilityRole="button"
                  accessibilityLabel="프로필 이미지 삭제"
                >
                  <Text className="text-[14px] font-bold leading-[16px] text-white">X</Text>
                </Pressable>
              ) : null}
            </View>

            {/* 닉네임 */}
            <Text className="mt-4 text-body04 text-grey-80">닉네임</Text>
            <View className="flex-row items-center gap-2.5">
              <Input
                className="mt-2 flex-1"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChangeText={(v) => {
                  setNickname(v);
                  setCheckedNickname(user?.nickname ?? null);
                }}
              />
              <Button
                variant={
                  nickname !== (user?.nickname ?? '') && checkedNickname !== nickname
                    ? 'default'
                    : 'subtle'
                }
                disabled={isCheckingNickname || checkedNickname === nickname || !nickname}
                onPress={handleCheckNickname}
              >
                <Text>{checkedNickname === nickname ? '확인 완료' : '중복 확인'}</Text>
              </Button>
            </View>

            {/* 단과대 */}
            <Text className="mt-4 text-body04 text-grey-80">단과대</Text>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <View className="mt-2 flex-row items-center rounded-md border border-grey-10 px-3 py-[9.5px]">
                  <Text
                    className={`flex-1 text-body06 ${collegeLabel ? 'text-grey-80' : 'text-grey-20'}`}
                    numberOfLines={1}
                  >
                    {collegeLabel ?? '단과대학을 선택해주세요'}
                  </Text>
                  <ArrowDownIcon size={24} className="text-grey-30" />
                </View>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {COLLEGE_OPTIONS.map((option) => (
                  <DropdownMenu.Item
                    key={option.value}
                    onSelect={() => {
                      setSelectedCollege(option.value);
                      setSelectedDepartment(null);
                    }}
                  >
                    <DropdownMenu.ItemTitle>{option.label}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* 학과 */}
            <Text className="mt-4 text-body04 text-grey-80">학과</Text>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger disabled={!selectedCollege}>
                <View
                  className={`mt-2 flex-row items-center rounded-md border border-grey-10 px-3 py-[9.5px] ${!selectedCollege ? 'opacity-40' : ''}`}
                >
                  <Text
                    className={`flex-1 text-body06 ${departmentLabel ? 'text-grey-80' : 'text-grey-20'}`}
                    numberOfLines={1}
                  >
                    {departmentLabel ?? '학과를 선택해주세요'}
                  </Text>
                  <ArrowDownIcon size={24} className="text-grey-30" />
                </View>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {departmentOptions.map((option) => (
                  <DropdownMenu.Item
                    key={option.value}
                    onSelect={() => setSelectedDepartment(option.value)}
                  >
                    <DropdownMenu.ItemTitle>{option.label}</DropdownMenu.ItemTitle>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* 학번 */}
            <Text className="mt-4 text-body04 text-grey-80">학번</Text>
            <View className="mt-2 flex-1 rounded-lg border border-grey-10 bg-grey-02 p-3">
              <Text className="text-body06 text-grey-40">{user?.studentNumber}</Text>
            </View>
            <Text className="mt-2 text-caption02 text-grey-30">※학번은 수정할 수 없습니다.</Text>
          </View>

          {/* 저장하기 버튼 */}
          <Button
            className="mt-4"
            variant={hasBasicInfoChanged ? 'default' : 'subtle'}
            disabled={!hasBasicInfoChanged || isSaving}
            onPress={handleSave}
          >
            <Text>저장하기</Text>
          </Button>
        </View>

        {/* 앱 푸터 */}
        <Footer />
      </ScrollView>
    </View>
  );
}
