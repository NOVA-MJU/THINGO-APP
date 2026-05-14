import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function ForgorPasswordScreen() {
  const [step, setStep] = React.useState(0);

  // 인증번호 전송 요청
  function handleRequestCode(): void {}

  // 인증번호 확인
  function handleSubmitCode(): void {}

  // step1
  function handleNextStep(): void {
    setStep(1);
  }

  // 비밀번호 변경하기
  function requestPasswordReset(): void {}

  return (
    <ScrollView className="bg-grey-02" contentContainerClassName="flex-grow">
      <View className="flex-1">
        {step === 0 && (
          <View className="px-4">
            <Text className="mt-[30px] text-title01 text-black">비밀번호 재설정</Text>
            <View className="mt-3 rounded-xl bg-white p-6">
              <Text className="text-body04 text-grey-80">이메일</Text>
              <View className="mt-2 flex-row gap-2.5">
                <Input placeholder="이메일을 입력하세요(@mju.ac.kr)" className="flex-1" />
                <Button variant="subtle" onPress={() => handleRequestCode()}>
                  <Text>인증요청</Text>
                </Button>
              </View>
              <Text className="mt-5 text-body04 text-grey-80">인증번호</Text>
              <View className="mt-2 flex-row gap-2.5">
                <Input placeholder="인증번호를 입력하세요" className="flex-1" />
                <Button variant="subtle" onPress={() => handleSubmitCode()}>
                  <Text>인증확인</Text>
                </Button>
              </View>
              <Button className="mt-6" variant="secondary" onPress={() => handleNextStep()}>
                <Text>비밀번호 재설정</Text>
              </Button>
              <View className="mt-6 flex-row items-center">
                <TouchableOpacity className="flex-1">
                  <View className="h-10 items-center justify-center">
                    <Text className="text-caption02 text-grey-20">아이디 찾기</Text>
                  </View>
                </TouchableOpacity>
                <View className="h-4 w-[1px] bg-grey-20" />
                <TouchableOpacity className="flex-1">
                  <View className="h-10 items-center justify-center">
                    <Text className="text-caption02 text-grey-20">비밀번호 찾기</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {step === 1 && (
          <View className="px-4">
            <Text className="mt-[30px] text-title01 text-black">비밀번호 재설정</Text>
            <View className="mt-3 rounded-xl bg-white p-6">
              <Text className="text-body04 text-grey-80">새 비밀번호</Text>
              <Input placeholder="새 비밀번호를 입력하세요" className="mt-2" />
              <Text className="mt-5 text-body04 text-grey-80">새 비밀번호 확인</Text>
              <Input placeholder="비밀번호를 다시 입력하세요" className="mt-2" />
              <Button className="mt-7" variant="secondary" onPress={() => requestPasswordReset()}>
                <Text>비밀번호 변경</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
      <Footer withBottomInset />
    </ScrollView>
  );
}
