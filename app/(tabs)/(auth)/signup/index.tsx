import {
  checkEmailVerificationCode,
  getMemberInfo,
  sendEmailVerificationCode,
  signup,
  validateEmail,
  validateNickname,
  validateStudentNumber,
} from '@/api/members';
import { Footer } from '@/components/footer';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '@/lib/validation';
import { ArrowDownIcon, ArrowRightIcon, CheckboxIcon, InfoCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { COLLEGE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { showAlert } from '@/lib/alert';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useState } from 'react';
import { Image, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';
import * as WebBrowser from 'expo-web-browser';
import { AppHeader } from '@/components/app-header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS_URL =
  'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e80b08328edd8519b0b4e?source=copy_link';
const LOCATION_PRIVACY_URL =
  'https://app.notion.com/p/Thingo-39722ef5d21e802ebf0edfe83047fa8f?source=copy_link';
const PRIVACY_URL =
  'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e807d9738dc14def5de24?source=copy_link';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUser } = useAuth();

  const [userEmail, setUserEmail] = useState('');
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCodeLoading, setVerificationCodeLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameVerified, setNicknameVerified] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [studentNumber, setStudentNumber] = useState('');
  const [studentNumberVerified, setStudentNumberVerified] = useState(false);
  const [studentNumberLoading, setStudentNumberLoading] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const { isLoading: isUploadingImage, pickAndUpload } = useImageUpload('PROFILE_IMAGE');

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [locationPrivacyAgreed, setLocationPrivacyAgreed] = useState(false);
  const allAgreed = termsAgreed && privacyAgreed && locationPrivacyAgreed;

  const isFormComplete =
    emailVerified &&
    !!password &&
    !!confirmPassword &&
    !!name.trim() &&
    nicknameVerified &&
    !!selectedCollege &&
    !!selectedDepartment &&
    studentNumberVerified &&
    allAgreed;

  // 전체동의 토글
  const handleToggleAllAgreements = () => {
    const next = !allAgreed;
    setTermsAgreed(next);
    setPrivacyAgreed(next);
    setLocationPrivacyAgreed(next);
  };

  const collegeLabel = COLLEGE_OPTIONS.find((c) => c.value === selectedCollege)?.label ?? null;
  const departmentOptions =
    DEPARTMENT_OPTIONS.find((d) => d.college.value === selectedCollege)?.departments ?? [];
  const departmentLabel =
    departmentOptions.find((d) => d.value === selectedDepartment)?.label ?? null;

  // 프로필 이미지 업로드
  const handlePickProfileImage = async () => {
    const url = await pickAndUpload();
    if (url) setProfileImageUrl(url);
  };

  // 학번 중복 확인
  const handleStudentNumberCheck = async () => {
    if (!studentNumber.trim()) return;
    setStudentNumberLoading(true);
    try {
      await validateStudentNumber(studentNumber);
      setStudentNumberVerified(true);
      showAlert('사용 가능한 학번입니다.');
    } catch (e) {
      setStudentNumberVerified(false);
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('학번 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setStudentNumberLoading(false);
    }
  };

  // 닉네임 중복 확인
  const handleNicknameCheck = async () => {
    if (!nickname.trim()) return;
    setNicknameLoading(true);
    try {
      await validateNickname(nickname);
      setNicknameVerified(true);
      showAlert('사용 가능한 닉네임입니다.');
    } catch (e) {
      setNicknameVerified(false);
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('닉네임 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setNicknameLoading(false);
    }
  };

  // 이메일 인증코드 확인
  const handleVerificationCodeCheck = async () => {
    if (!verificationCode.trim()) return;
    setVerificationCodeLoading(true);
    try {
      const matched = await checkEmailVerificationCode(`${userEmail}@mju.ac.kr`, verificationCode);
      if (matched) {
        setEmailVerified(true);
        showAlert('이메일 인증이 완료되었습니다.');
      } else {
        showAlert('인증코드가 올바르지 않습니다.');
      }
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('인증코드 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setVerificationCodeLoading(false);
    }
  };

  // 회원가입
  const handleSignup = async () => {
    if (!emailVerified) return showAlert('이메일 인증을 완료해주세요.');
    if (!password) return showAlert('비밀번호를 입력해주세요.');
    if (!PASSWORD_REGEX.test(password)) return showAlert(PASSWORD_MESSAGE);
    if (password !== confirmPassword) return showAlert('비밀번호가 일치하지 않습니다.');
    if (!name.trim()) return showAlert('이름을 입력해주세요.');
    if (!nicknameVerified) return showAlert('닉네임 중복 확인을 해주세요.');
    if (!selectedCollege) return showAlert('단과대를 선택해주세요.');
    if (!selectedDepartment) return showAlert('학과를 선택해주세요.');
    if (!studentNumberVerified) return showAlert('학번 중복 확인을 해주세요.');
    if (!allAgreed) return showAlert('필수 약관에 모두 동의해주세요.');

    setSignupLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: `${userEmail}@mju.ac.kr`,
        password,
        nickname,
        college: selectedCollege,
        departmentName: selectedDepartment,
        studentNumber,
        profileImageUrl: profileImageUrl ?? undefined,
        privacyAgreed: allAgreed,
      });
      const member = await getMemberInfo();
      setUser(member);
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.dismissAll();
      }
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // 이메일 인증코드 요청
  const handleEmailVerification = async () => {
    if (!userEmail.trim()) {
      showAlert('이메일을 입력해주세요.');
      return;
    }
    setEmailVerificationLoading(true);
    try {
      const email = `${userEmail}@mju.ac.kr`;
      await validateEmail(email);
      await sendEmailVerificationCode(email);
      setVerificationCodeSent(true);
      setVerificationCode('');
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        showAlert(e.response.data.message);
      } else {
        showAlert('이메일 검증 중 오류가 발생했습니다.');
      }
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <AppHeader title="회원가입" />
      </View>
      <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1 px-4">
          <View className="mt-5 flex-row gap-1">
            <Text className="text-title03 text-black">계정 정보</Text>
            <Text className="text-title03 text-error">*</Text>
          </View>
          <View className="mt-2 gap-4 rounded-xl bg-white p-4">
            <View>
              {/* 이메일 */}
              <Text className="text-body04 text-grey-80">이메일</Text>
              <View className="mt-2 flex-row items-center gap-2.5">
                <Input
                  placeholder="이메일을 입력하세요"
                  className="flex-1"
                  value={userEmail}
                  onChangeText={setUserEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  keyboardType="email-address"
                  textContentType="username"
                  editable={!emailVerified}
                />
                <Text className="text-body06 text-grey-30">@mju.ac.kr</Text>
                <Button
                  variant={userEmail.trim() ? 'default' : 'subtle'}
                  className="rounded-md"
                  onPress={handleEmailVerification}
                  disabled={emailVerificationLoading || emailVerified}
                >
                  <Text>{emailVerificationLoading ? '요청 중...' : '인증요청'}</Text>
                </Button>
              </View>

              {/* 인증코드 */}
              {verificationCodeSent && (
                <View className="mt-2 flex-row items-center gap-2.5">
                  <Input
                    placeholder="인증코드를 입력하세요"
                    className="flex-1"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="default"
                    editable={!emailVerified}
                  />
                  <Button
                    variant={verificationCode.trim() ? 'default' : 'subtle'}
                    onPress={handleVerificationCodeCheck}
                    disabled={verificationCodeLoading || emailVerified}
                  >
                    <Text>
                      {verificationCodeLoading ? '확인 중...' : emailVerified ? '인증완료' : '확인'}
                    </Text>
                  </Button>
                </View>
              )}
            </View>

            <View>
              {/* 비밀번호 */}
              <Text className="text-body04 text-grey-80">비밀번호</Text>
              <Input
                placeholder="비밀번호를 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
              />
              <View className="mt-2 flex-row items-center gap-1">
                <InfoCircleIcon size={16} className="text-grey-30" />
                <Text className="text-caption02 text-grey-30">
                  영문, 숫자, 특수문자 포함 8자 이상
                </Text>
              </View>
            </View>

            <View>
              {/* 비밀번호 확인 */}
              <Text className="text-body04 text-grey-80">비밀번호 확인</Text>
              <Input
                placeholder="비밀번호를 다시 입력하세요"
                className="mt-2"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <View className="mt-4 flex-row gap-1">
            <Text className="text-title03 text-black">기본 정보</Text>
            <Text className="text-title03 text-error">*</Text>
          </View>
          <View className="mt-2 gap-4 rounded-xl bg-white p-4">
            <View>
              {/* 이름 */}
              <Text className="text-body04 text-grey-80">이름</Text>
              <Input
                placeholder="홍길동 (실명)"
                className="mt-2"
                value={name}
                onChangeText={setName}
              />
              <Text className="mt-2 text-caption02 text-grey-30">
                ※ 실명을 입력하지 않을 경우 추후 불이익이 발생할 수 있습니다.
              </Text>
            </View>

            <View>
              {/* 닉네임 */}
              <Text className="text-body04 text-grey-80">닉네임</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Input
                  placeholder="닉네임을 입력하세요"
                  className="flex-1"
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    setNicknameVerified(false);
                  }}
                />
                <Button
                  variant={nickname.trim() && !nicknameVerified ? 'default' : 'subtle'}
                  className="rounded-md"
                  onPress={handleNicknameCheck}
                  disabled={nicknameLoading || nicknameVerified}
                >
                  <Text>
                    {nicknameLoading ? '확인 중...' : nicknameVerified ? '확인 완료' : '중복 확인'}
                  </Text>
                </Button>
              </View>
            </View>

            <View>
              {/* 단과대 */}
              <Text className="text-body04 text-grey-80">단과대</Text>
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
            </View>

            <View>
              {/* 학과 */}
              <Text className="text-body04 text-grey-80">학과</Text>
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
            </View>

            <View>
              {/* 학번 */}
              <Text className="text-body04 text-grey-80">학번</Text>
              <View className="mt-2 flex-row items-center gap-2">
                <Input
                  placeholder="ex. 60000000"
                  className="flex-1"
                  value={studentNumber}
                  onChangeText={(text) => {
                    setStudentNumber(text);
                    setStudentNumberVerified(false);
                  }}
                  keyboardType="number-pad"
                />
                <Button
                  variant={studentNumber.trim() && !studentNumberVerified ? 'default' : 'subtle'}
                  className="rounded-md"
                  onPress={handleStudentNumberCheck}
                  disabled={studentNumberLoading || studentNumberVerified}
                >
                  <Text>
                    {studentNumberLoading
                      ? '확인 중...'
                      : studentNumberVerified
                        ? '확인 완료'
                        : '중복 확인'}
                  </Text>
                </Button>
              </View>
            </View>
          </View>

          {/* 프로필 사진 */}
          <View className="mt-4 flex-row items-center gap-1">
            <Text className="text-title03 text-black">프로필 사진</Text>
            <Text className="text-body02 text-grey-80">(선택)</Text>
          </View>
          <View className="mt-2 rounded-xl bg-white p-4">
            <Text className="text-body04 text-grey-80">프로필</Text>
            <TouchableOpacity
              className="mt-2 self-start"
              onPress={handlePickProfileImage}
              disabled={isUploadingImage}
            >
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
          </View>

          {/* 약관 동의 */}
          <Text className="mt-4 text-title03 text-black">약관동의</Text>
          <View className="mt-2 gap-4 rounded-xl bg-white py-4">
            <View className="flex-row items-center gap-1 px-4">
              <TouchableOpacity hitSlop={4} onPress={handleToggleAllAgreements}>
                <CheckboxIcon checked={allAgreed} />
              </TouchableOpacity>
              <Text className="text-body05 text-grey-80">전체동의</Text>
            </View>
            <View className="mx-4 h-[1px] w-full bg-grey-02" />
            <View className="flex-row items-center gap-1 px-4">
              <TouchableOpacity hitSlop={4} onPress={() => setTermsAgreed((prev) => !prev)}>
                <CheckboxIcon checked={termsAgreed} />
              </TouchableOpacity>
              <Text className="text-body05 text-grey-80">(필수)</Text>
              <Text className="flex-1 text-body05 text-grey-80">Thingo 서비스 이용약관 동의</Text>
              <TouchableOpacity hitSlop={4} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>
                <ArrowRightIcon size={20} className="text-grey-30" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-1 px-4">
              <TouchableOpacity hitSlop={4} onPress={() => setPrivacyAgreed((prev) => !prev)}>
                <CheckboxIcon checked={privacyAgreed} />
              </TouchableOpacity>
              <Text className="text-body05 text-grey-80">(필수)</Text>
              <Text className="flex-1 text-body05 text-grey-80">개인정보 수집 및 이용동의</Text>
              <TouchableOpacity
                hitSlop={4}
                onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}
              >
                <ArrowRightIcon size={20} className="text-grey-30" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-1 px-4">
              <TouchableOpacity
                hitSlop={4}
                onPress={() => setLocationPrivacyAgreed((prev) => !prev)}
              >
                <CheckboxIcon checked={locationPrivacyAgreed} />
              </TouchableOpacity>
              <Text className="text-body05 text-grey-80">(필수)</Text>
              <Text className="flex-1 text-body05 text-grey-80">위치기반 서비스 이용약관 동의</Text>
              <TouchableOpacity
                hitSlop={4}
                onPress={() => WebBrowser.openBrowserAsync(LOCATION_PRIVACY_URL)}
              >
                <ArrowRightIcon size={20} className="text-grey-30" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 회원가입 버튼 */}
          <Button
            variant={isFormComplete ? 'default' : 'secondary'}
            className="mt-4"
            onPress={handleSignup}
            disabled={signupLoading || !isFormComplete}
          >
            <Text>{signupLoading ? '가입 중...' : 'Thingo 시작하기'}</Text>
          </Button>
        </View>
        <Footer className="mt-16" />
      </ScrollView>
    </View>
  );
}
