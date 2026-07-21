import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

// 웹은 작은 팝업창(WebBrowser 기본 동작) 대신 새 탭으로 열기 위해 Linking 사용
export async function openLink(url: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

// 배너처럼 앱 내부 경로(상대경로)와 외부 URL이 섞여 내려오는 값을 다룰 때 사용:
// 외부 URL이면 openLink, 내부 경로면 라우터로 이동 (openLink로 상대경로를 열면
// 모바일은 WebBrowser가 에러, 웹은 새 탭으로 열려 앱을 벗어나 버림)
export function openLinkOrNavigate(url: string) {
  if (ABSOLUTE_URL_REGEX.test(url)) {
    return openLink(url);
  }
  router.push(url as never);
}
