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

// 시스템 기본 확인/취소 모달 출력(콜백 지원)
export function showConfirm(
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  options?: { confirmText?: string; cancelText?: string }
) {
  const confirmText = options?.confirmText ?? '확인';
  const cancelText = options?.cancelText ?? '취소';

  if (Platform.OS === 'web') {
    if (window.confirm(message ? `${title}\n${message}` : title)) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
}
