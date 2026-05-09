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
import { ArrowDownIcon, InfoCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/context/auth-context';
import { COLLEGE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { DepartmentSelectModal } from './_components/department-select-modal';

export default function SignupScreen() {
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
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | null>(null);
  const [studentNumber, setStudentNumber] = useState('');
  const [studentNumberVerified, setStudentNumberVerified] = useState(false);
  const [studentNumberLoading, setStudentNumberLoading] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const collegeLabel = COLLEGE_OPTIONS.find((c) => c.value === selectedCollege)?.label ?? null;
  const departmentOptions =
    DEPARTMENT_OPTIONS.find((d) => d.college.value === selectedCollege)?.departments ?? [];
  const departmentLabel =
    departmentOptions.find((d) => d.value === selectedDepartment)?.label ?? null;

  // 학번 중복 확인
  const handleStudentNumberCheck = async () => {
    if (!studentNumber.trim()) return;
    setStudentNumberLoading(true);
    try {
      await validateStudentNumber(studentNumber);
      setStudentNumberVerified(true);
      Alert.alert('사용 가능한 학번입니다.');
    } catch (e) {
      setStudentNumberVerified(false);
      if (isAxiosError(e) && e.response?.data?.message) {
        Alert.alert(e.response.data.message);
      } else {
        Alert.alert('학번 확인 중 오류가 발생했습니다.');
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
      Alert.alert('사용 가능한 닉네임입니다.');
    } catch (e) {
      setNicknameVerified(false);
      if (isAxiosError(e) && e.response?.data?.message) {
        Alert.alert(e.response.data.message);
      } else {
        Alert.alert('닉네임 확인 중 오류가 발생했습니다.');
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
        Alert.alert('이메일 인증이 완료되었습니다.');
      } else {
        Alert.alert('인증코드가 올바르지 않습니다.');
      }
    } catch (e) {
      if (isAxiosError(e) && e.response?.data?.message) {
        Alert.alert(e.response.data.message);
      } else {
        Alert.alert('인증코드 확인 중 오류가 발생했습니다.');
      }
    } finally {
      setVerificationCodeLoading(false);
    }
  };

  // 회원가입
  const handleSignup = async () => {
    if (!emailVerified) return Alert.alert('이메일 인증을 완료해주세요.');
    if (!password) return Alert.alert('비밀번호를 입력해주세요.');
    if (password !== confirmPassword) return Alert.alert('비밀번호가 일치하지 않습니다.');
    if (!name.trim()) return Alert.alert('이름을 입력해주세요.');
    if (!nicknameVerified) return Alert.alert('닉네임 중복 확인을 해주세요.');
    if (!gender) return Alert.alert('성별을 선택해주세요.');
    if (!selectedCollege) return Alert.alert('단과대를 선택해주세요.');
    if (!selectedDepartment) return Alert.alert('학과를 선택해주세요.');
    if (!studentNumberVerified) return Alert.alert('학번 중복 확인을 해주세요.');

    setSignupLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: `${userEmail}@mju.ac.kr`,
        password,
        nickname,
        gender,
        college: selectedCollege,
        departmentName: selectedDepartment,
        studentNumber,
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
        Alert.alert(e.response.data.message);
      } else {
        Alert.alert('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // 이메일 인증코드 요청
  const handleEmailVerification = async () => {
    if (!userEmail.trim()) {
      Alert.alert('이메일을 입력해주세요.');
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
        Alert.alert(e.response.data.message);
      } else {
        Alert.alert('이메일 검증 중 오류가 발생했습니다.');
      }
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  return (
    <>
      <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
        <View className="flex-1 px-4">
          <View className="mt-5 flex-row gap-1">
            <Text className="text-title01 text-black">계정 정보</Text>
            <Text className="text-title01 text-error">*</Text>
          </View>
          <View className="mt-3 rounded-xl bg-white p-6">
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

            {/* 비밀번호 */}
            <Text className="mt-6 text-body04 text-grey-80">비밀번호</Text>
            <Input
              placeholder="비밀번호를 입력하세요"
              className="mt-2"
              secureTextEntry
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
            />
            <View className="mt-2 flex-row items-center gap-1">
              <InfoCircleIcon size={16} className="text-grey-30" />
              <Text className="text-caption02 text-grey-30">8~16자의 영문 대소문자</Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1">
              <InfoCircleIcon size={16} className="text-grey-30" />
              <Text className="text-caption02 text-grey-30">숫자 1개 이상 포함</Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1">
              <InfoCircleIcon size={16} className="text-grey-30" />
              <Text className="text-caption02 text-grey-30">특수문자 1개 이상 포함</Text>
            </View>
            <Text className="mt-6 text-body04 text-grey-80">비밀번호 확인</Text>
            <Input
              placeholder="비밀번호를 다시 입력하세요"
              className="mt-2"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View className="mt-10 flex-row gap-1">
            <Text className="text-title01 text-black">기본 정보</Text>
            <Text className="text-title01 text-error">*</Text>
          </View>
          <View className="mt-3 rounded-xl bg-white p-6">
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

            {/* 닉네임 */}
            <Text className="mt-6 text-body04 text-grey-80">닉네임</Text>
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
                onPress={handleNicknameCheck}
                disabled={nicknameLoading || nicknameVerified}
              >
                <Text>
                  {nicknameLoading ? '확인 중...' : nicknameVerified ? '확인 완료' : '중복 확인'}
                </Text>
              </Button>
            </View>

            {/* 단과대 */}
            <Text className="mt-6 text-body04 text-grey-80">단과대</Text>
            <TouchableOpacity onPress={() => setCollegeModalOpen(true)}>
              <View className="mt-2 flex-row items-center rounded-md border border-grey-10 px-3 py-[9.5px]">
                <Text
                  className={`flex-1 text-body06 ${collegeLabel ? 'text-grey-80' : 'text-grey-20'}`}
                  numberOfLines={1}
                >
                  {collegeLabel ?? '단과대학을 선택해주세요'}
                </Text>
                <ArrowDownIcon size={24} className="text-grey-30" />
              </View>
            </TouchableOpacity>

            {/* 학과 */}
            <Text className="mt-6 text-body04 text-grey-80">학과</Text>
            <TouchableOpacity
              onPress={() => setDepartmentModalOpen(true)}
              disabled={!selectedCollege}
            >
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
            </TouchableOpacity>

            {/* 학번 */}
            <Text className="mt-6 text-body04 text-grey-80">학번</Text>
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

            {/* 성별 */}
            <Text className="mt-6 text-body04 text-grey-80">성별</Text>
            <View className="mt-2 flex-row gap-2">
              <Button
                variant={gender === 'MALE' ? 'default' : 'muted'}
                className="flex-1"
                onPress={() => setGender('MALE')}
              >
                <Text>남자</Text>
              </Button>
              <Button
                variant={gender === 'FEMALE' ? 'default' : 'muted'}
                className="flex-1"
                onPress={() => setGender('FEMALE')}
              >
                <Text>여자</Text>
              </Button>
              <Button
                variant={gender === 'OTHER' ? 'default' : 'muted'}
                className="flex-1"
                onPress={() => setGender('OTHER')}
              >
                <Text>기타</Text>
              </Button>
            </View>
          </View>

          {/* 프로필 사진 */}
          <Text className="mt-10 text-title01 text-black">프로필 사진 (선택)</Text>
          <View className="mt-3 rounded-xl bg-white p-6">
            <Text className="text-body04 text-grey-80">프로필</Text>
            <TouchableOpacity className="mt-2 self-start">
              <View className="aspect-square w-[88px] items-center justify-center rounded-xl border border-grey-10">
                <Text className="text-caption02 text-grey-20">이미지 업로드</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 회원가입 버튼 */}
          <Button
            variant="secondary"
            className="mt-5"
            onPress={handleSignup}
            disabled={signupLoading}
          >
            <Text>{signupLoading ? '가입 중...' : 'Thingo 시작하기'}</Text>
          </Button>
        </View>
        <Footer className="mt-6" withBottomInset />
      </ScrollView>

      {/* 학과 선택 모달 */}
      <DepartmentSelectModal
        visible={collegeModalOpen}
        title="단과대 선택"
        options={COLLEGE_OPTIONS}
        selectedValue={selectedCollege}
        onSelect={(value) => {
          setSelectedCollege(value);
          setSelectedDepartment(null);
        }}
        onClose={() => setCollegeModalOpen(false)}
      />
      <DepartmentSelectModal
        visible={departmentModalOpen}
        title="학과 선택"
        options={departmentOptions}
        selectedValue={selectedDepartment}
        onSelect={setSelectedDepartment}
        onClose={() => setDepartmentModalOpen(false)}
      />
    </>
  );
}
