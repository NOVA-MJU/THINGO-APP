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

// 모바일은 홈 탭이 라우트가 아니라 `tab` 쿼리 파라미터로 열리므로 탭 경로를 변환해야 함.
// 값은 app/(tabs)/(home)/index.tsx의 TAB_QUERY_SLUGS와 맞춰야 함
const MOBILE_HOME_TAB_BY_PATH = new Map<string, string>([
  ['/', ''],
  ['/meal', 'meal'],
  ['/posts', 'board'],
  ['/notices', 'notices'],
  ['/academic-calendar', 'academic-calendar'],
  ['/newspaper', 'newspaper'],
  ['/news', 'news'],
]);

export function isExternalUrl(url: string) {
  return ABSOLUTE_URL_REGEX.test(url);
}

// 서버가 내려주는 내부 경로('/meal' 등)를 플랫폼에 맞게 이동시킴.
// 웹은 경로가 실제 URL이라 그대로 push하면 되지만, 모바일은 홈 탭 경로를
// 헤더·탭바가 있는 홈 화면의 `tab` 파라미터로 바꿔야 빈 화면이 뜨지 않음
export function navigateToInternalPath(path: string) {
  const [pathname] = path.split('?');
  const tab = MOBILE_HOME_TAB_BY_PATH.get(pathname);

  if (Platform.OS !== 'web' && tab !== undefined) {
    router.push((tab ? { pathname: '/', params: { tab } } : '/') as never);
    return;
  }

  router.push(path as never);
}

// 배너처럼 앱 내부 경로(상대경로)와 외부 URL이 섞여 내려오는 값을 다룰 때 사용:
// 외부 URL이면 openLink, 내부 경로면 라우터로 이동 (openLink로 상대경로를 열면
// 모바일은 WebBrowser가 에러, 웹은 새 탭으로 열려 앱을 벗어나 버림)
export async function openLinkOrNavigate(url: string) {
  if (isExternalUrl(url)) {
    await openLink(url);
    return;
  }
  navigateToInternalPath(url);
}
