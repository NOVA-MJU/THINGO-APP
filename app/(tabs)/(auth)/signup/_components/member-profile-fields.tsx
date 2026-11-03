import { validateNickname, validateStudentNumber } from '@/api/members';
import { ArrowDownIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { showAlert } from '@/lib/alert';
import { COLLEGE_OPTIONS, DEPARTMENT_OPTIONS } from '@/lib/departments';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

export type MemberProfile = {
  nickname: string;
  college: string;
  departmentName: string;
  studentNumber: string;
};

type MemberProfileFieldsProps = {
  // 닉네임·학번 중복 확인과 단과대·학과 선택이 모두 끝나면 값을, 하나라도 비면 null을 알린다
  onChange: (profile: MemberProfile | null) => void;
  // 구글 가입에서 프로필 소속으로 찾은 학과를 미리 골라 둔다. 사용자가 바꿀 수 있다
  initialCollege?: string | null;
  initialDepartment?: string | null;
};

// 이메일 가입과 구글 가입이 함께 쓰는 닉네임·단과대·학과·학번 입력 칸. 중복 확인 상태를 스스로 관리한다
export default function MemberProfileFields({
  onChange,
  initialCollege = null,
  initialDepartment = null,
}: MemberProfileFieldsProps) {
  const [nickname, setNickname] = useState('');
  const [nicknameVerified, setNicknameVerified] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [studentNumber, setStudentNumber] = useState('');
  const [studentNumberVerified, setStudentNumberVerified] = useState(false);
  const [studentNumberLoading, setStudentNumberLoading] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(initialCollege);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(initialDepartment);

  const collegeLabel = COLLEGE_OPTIONS.find((c) => c.value === selectedCollege)?.label ?? null;
  const departmentOptions =
    DEPARTMENT_OPTIONS.find((d) => d.college.value === selectedCollege)?.departments ?? [];
  const departmentLabel =
    departmentOptions.find((d) => d.value === selectedDepartment)?.label ?? null;

  useEffect(() => {
    const complete =
      nicknameVerified && studentNumberVerified && !!selectedCollege && !!selectedDepartment;
    onChange(
      complete
        ? {
            nickname,
            college: selectedCollege,
            departmentName: selectedDepartment,
            studentNumber,
          }
        : null
    );
  }, [
    nickname,
    nicknameVerified,
    studentNumber,
    studentNumberVerified,
    selectedCollege,
    selectedDepartment,
    onChange,
  ]);

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

  return (
    <>
      <View>
        {/* 닉네임 */}
        <Text className="text-grey-80 text-body04">닉네임</Text>
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
        <Text className="text-grey-80 text-body04">단과대</Text>
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
        <Text className="text-grey-80 text-body04">학과</Text>
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
        <Text className="text-grey-80 text-body04">학번</Text>
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
    </>
  );
}
