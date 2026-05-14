import { Footer } from '@/components/footer';
import { ArrowDownIcon, InfoCircleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  return (
    <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1 px-4">
        <View className="mt-5 flex-row gap-1">
          <Text className="text-title01 text-black">계정 정보</Text>
          <Text className="text-title01 text-error">*</Text>
        </View>
        <View className="mt-3 rounded-xl bg-white p-6">
          <Text className="text-body04 text-grey-80">이메일</Text>
          <View className="mt-2 flex-row items-center gap-2.5">
            <Input placeholder="이메일을 입력하세요" className="flex-1" />
            <Text className="text-body06 text-grey-30">@mju.ac.kr</Text>
            <Button variant="subtle">
              <Text>인증요청</Text>
            </Button>
          </View>
          <Text className="mt-6 text-body04 text-grey-80">비밀번호</Text>
          <Input placeholder="비밀번호를 입력하세요" className="mt-2" />
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
          <Text className="mt-6 text-body04 text-grey-80">비밀번호</Text>
          <Input placeholder="비밀번호를 다시 입력하세요" className="mt-2" />
        </View>

        <View className="mt-10 flex-row gap-1">
          <Text className="text-title01 text-black">기본 정보</Text>
          <Text className="text-title01 text-error">*</Text>
        </View>
        <View className="mt-3 rounded-xl bg-white p-6">
          <Text className="text-body04 text-grey-80">이름</Text>
          <Input placeholder="홍길동 (실명)" className="mt-2" />
          <Text className="mt-2 text-caption02 text-grey-30">
            ※ 실명을 입력하지 않을 경우 추후 불이익이 발생할 수 있습니다.
          </Text>
          <Text className="mt-6 text-body04 text-grey-80">닉네임</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Input placeholder="닉네임을 입력하세요" className="flex-1" />
            <Button variant="subtle">
              <Text>중복 확인</Text>
            </Button>
          </View>
          <Text className="mt-6 text-body04 text-grey-80">단과대</Text>
          <TouchableOpacity>
            <View className="mt-2 flex-row items-center rounded-md border border-grey-10 px-3 py-[9.5px]">
              <Text className="flex-1 text-body06 text-grey-20" numberOfLines={1}>
                단과대학을 선택해주세요
              </Text>
              <ArrowDownIcon size={24} className="text-grey-30" />
            </View>
          </TouchableOpacity>
          <Text className="mt-6 text-body04 text-grey-80">학과</Text>
          <TouchableOpacity>
            <View className="mt-2 flex-row items-center rounded-md border border-grey-10 px-3 py-[9.5px]">
              <Text className="flex-1 text-body06 text-grey-20" numberOfLines={1}>
                학과를 선택해주세요
              </Text>
              <ArrowDownIcon size={24} className="text-grey-30" />
            </View>
          </TouchableOpacity>
          <Text className="mt-6 text-body04 text-grey-80">학번</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Input placeholder="ex. 60000000" className="flex-1" />
            <Button variant="subtle">
              <Text>중복 확인</Text>
            </Button>
          </View>
          <Text className="mt-6 text-body04 text-grey-80">성별</Text>
          <View className="mt-2 flex-row gap-2">
            <Button variant="muted" className="flex-1">
              <Text>남자</Text>
            </Button>
            <Button variant="muted" className="flex-1">
              <Text>여자</Text>
            </Button>
            <Button variant="muted" className="flex-1">
              <Text>기타</Text>
            </Button>
          </View>
        </View>

        <Text className="mt-10 text-title01 text-black">프로필 사진 (선택)</Text>
        <View className="mt-3 rounded-xl bg-white p-6">
          <Text className="text-body04 text-grey-80">프로필</Text>
          <TouchableOpacity className="mt-2 self-start">
            <View className="aspect-square w-[88px] items-center justify-center rounded-xl border border-grey-10">
              <Text className="text-caption02 text-grey-20">이미지 업로드</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button variant="secondary" className="mt-5">
          <Text>Thingo 시작하기</Text>
        </Button>
      </View>

      <Footer className="mt-6" withBottomInset />
    </ScrollView>
  );
}
