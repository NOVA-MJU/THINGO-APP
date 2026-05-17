import { Alert, Platform } from 'react-native';

// 시스템 기본 알림 출력(콜백 지원)
export function showAlert(title: string, message?: string, onConfirm?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
    onConfirm?.();
  } else {
    Alert.alert(title, message, [{ text: '확인', onPress: onConfirm }]);
  }
}
