import { ArrowRightIcon, CheckboxIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { openLink } from '@/lib/open-link';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

const TERMS_URL = 'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e80b08328edd8519b0b4e';
const LOCATION_PRIVACY_URL =
  'https://verbena-ixia-597.notion.site/Thingo-39722ef5d21e802ebf0edfe83047fa8f';
const PRIVACY_URL = 'https://verbena-ixia-597.notion.site/Thingo-33e22ef5d21e807d9738dc14def5de24';

type TermsAgreementProps = {
  // 필수 약관 세 개에 모두 동의했는지 알린다
  onChange: (allAgreed: boolean) => void;
};

export default function TermsAgreement({ onChange }: TermsAgreementProps) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [locationPrivacyAgreed, setLocationPrivacyAgreed] = useState(false);
  const allAgreed = termsAgreed && privacyAgreed && locationPrivacyAgreed;

  useEffect(() => {
    onChange(allAgreed);
  }, [allAgreed, onChange]);

  // 전체동의 토글
  const handleToggleAllAgreements = () => {
    const next = !allAgreed;
    setTermsAgreed(next);
    setPrivacyAgreed(next);
    setLocationPrivacyAgreed(next);
  };

  return (
    <>
      <Text className="mt-4 text-black text-title03">약관동의</Text>
      <View className="mt-2 gap-4 rounded-xl bg-white py-4">
        <View className="flex-row items-center gap-1 px-4">
          <TouchableOpacity hitSlop={4} onPress={handleToggleAllAgreements}>
            <CheckboxIcon checked={allAgreed} />
          </TouchableOpacity>
          <Text className="text-grey-80 text-body05">전체동의</Text>
        </View>
        <View className="mx-4 h-[1px] w-full bg-grey-02" />
        <View className="flex-row items-center gap-1 px-4">
          <TouchableOpacity hitSlop={4} onPress={() => setTermsAgreed((prev) => !prev)}>
            <CheckboxIcon checked={termsAgreed} />
          </TouchableOpacity>
          <Text className="text-grey-80 text-body05">(필수)</Text>
          <Text className="flex-1 text-grey-80 text-body05">Thingo 서비스 이용약관 동의</Text>
          <TouchableOpacity hitSlop={4} onPress={() => openLink(TERMS_URL)}>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-1 px-4">
          <TouchableOpacity hitSlop={4} onPress={() => setPrivacyAgreed((prev) => !prev)}>
            <CheckboxIcon checked={privacyAgreed} />
          </TouchableOpacity>
          <Text className="text-grey-80 text-body05">(필수)</Text>
          <Text className="flex-1 text-grey-80 text-body05">개인정보 수집 및 이용동의</Text>
          <TouchableOpacity hitSlop={4} onPress={() => openLink(PRIVACY_URL)}>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center gap-1 px-4">
          <TouchableOpacity hitSlop={4} onPress={() => setLocationPrivacyAgreed((prev) => !prev)}>
            <CheckboxIcon checked={locationPrivacyAgreed} />
          </TouchableOpacity>
          <Text className="text-grey-80 text-body05">(필수)</Text>
          <Text className="flex-1 text-grey-80 text-body05">위치기반 서비스 이용약관 동의</Text>
          <TouchableOpacity hitSlop={4} onPress={() => openLink(LOCATION_PRIVACY_URL)}>
            <ArrowRightIcon size={20} className="text-grey-30" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
