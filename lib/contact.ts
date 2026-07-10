import { showAlert } from '@/lib/alert';
import { Linking } from 'react-native';

const CONTACT_MAIL = `mailto:mjsearch2025@gmail.com?subject=${encodeURIComponent('문의 내용을 작성해주세요')}&body=${encodeURIComponent('안녕하세요,\n\n문의사항을 아래에 작성해주세요.\n\n- 이름:\n- 연락처:\n- 문의 내용:')}`;

export async function openContactMail() {
  const supported = await Linking.canOpenURL(CONTACT_MAIL);
  if (!supported) {
    showAlert('알림', 'mail 앱이 설치되어있지 않습니다.');
    return;
  }
  try {
    await Linking.openURL(CONTACT_MAIL);
  } catch {
    showAlert('알림', 'mail 앱이 설치되어있지 않습니다.');
  }
}
