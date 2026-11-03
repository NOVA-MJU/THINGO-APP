import { GoogleIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { GoogleSignInButtonProps } from './google-sign-in-button';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const isGoogleSignInAvailable = !!WEB_CLIENT_ID;

// 구글은 앱 안 브라우저(웹뷰)에서 로그인을 막는다(403 disallowed_useragent). 카카오톡·에브리타임 링크로 들어오는 경우가 많아
// 버튼을 누르기 전에 바깥 브라우저로 열도록 알린다. 마지막 두 패턴은 안드로이드 웹뷰(wv)와 Safari 표시가 없는 iOS 웹뷰다
const IN_APP_BROWSER_PATTERN =
  /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\/|; wv\)|(iPhone|iPad|iPod)(?!.*Safari)/i;
const isInAppBrowser =
  typeof navigator !== 'undefined' && IN_APP_BROWSER_PATTERN.test(navigator.userAgent);

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        hd?: string;
        ux_mode?: 'popup' | 'redirect';
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          text?: string;
          shape?: string;
          width?: number;
          locale?: string;
          logo_alignment?: 'left' | 'center';
        }
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

// 구글 로그인 스크립트는 페이지에 한 번만 넣고, 여러 버튼이 같은 로딩을 기다리도록 promise를 공유한다
let gsiScriptPromise: Promise<GoogleIdentity> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  gsiScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.google ? resolve(window.google) : reject(new Error('gsi unavailable'));
    script.onerror = () => {
      gsiScriptPromise = null;
      reject(new Error('gsi load failed'));
    };
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

// ID 토큰을 받는 흐름은 구글이 그린 버튼으로만 시작할 수 있고 그 버튼은 iframe이라 모양을 바꿀 수 없다.
// 앱과 같은 모양을 직접 그리고 그 위에 거의 투명한 구글 버튼을 겹쳐 클릭을 받는다. 완전히 투명하면 브라우저가 클릭을 막을 수 있어 0.01로 둔다
export function GoogleSignInButton({ onIdToken, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<View>(null);
  const onIdTokenRef = useRef(onIdToken);
  onIdTokenRef.current = onIdToken;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!WEB_CLIENT_ID || isInAppBrowser) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        const container = containerRef.current as unknown as HTMLElement | null;
        if (cancelled || !container) return;
        google.accounts.id.initialize({
          client_id: WEB_CLIENT_ID,
          callback: ({ credential }) => onIdTokenRef.current(credential),
          hd: 'mju.ac.kr',
          ux_mode: 'popup',
        });
        google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(container.clientWidth || 400, 400),
          locale: 'ko',
          logo_alignment: 'center',
        });
      })
      // 스크립트를 못 불러오면(광고 차단·오프라인) 이유를 안내하고, 이메일 로그인은 그대로 쓸 수 있다
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isGoogleSignInAvailable) return null;

  if (isInAppBrowser) {
    return (
      <View className="rounded-md bg-grey-02 p-3">
        <Text className="text-grey-80 text-body04">
          앱 안에서 연 화면에서는 구글 로그인이 되지 않아요
        </Text>
        <Text className="mt-1 text-grey-40 text-caption02">
          오른쪽 위 메뉴에서 {"'다른 브라우저로 열기'"}를 눌러 Chrome이나 Safari에서 다시
          시도해주세요.
        </Text>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <Text className="text-center text-grey-40 text-caption02">
        구글 로그인 버튼을 불러오지 못했어요. 광고 차단 기능을 끄거나 인터넷 연결을 확인한 뒤
        새로고침해주세요.
      </Text>
    );
  }

  return (
    <View
      className="h-[50px] w-full"
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
    >
      <View className="h-[50px] flex-row items-center justify-center gap-2 rounded-xl border border-grey-20 bg-white">
        <GoogleIcon size={20} />
        <Text className="text-grey-80 text-body02">구글로 계속하기</Text>
      </View>
      {/* 구글 버튼 높이는 40px로 고정이라 세로로 늘려 50px 전체가 눌리게 한다 */}
      <View
        ref={containerRef}
        className="absolute inset-0 items-center justify-center overflow-hidden"
        style={{ opacity: 0.01, transform: [{ scaleY: 1.25 }] }}
      />
    </View>
  );
}
