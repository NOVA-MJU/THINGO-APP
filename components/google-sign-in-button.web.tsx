import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import type { GoogleSignInButtonProps } from './google-sign-in-button';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export const isGoogleSignInAvailable = !!WEB_CLIENT_ID;

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

// 웹은 Google Identity Services 공식 버튼을 쓴다. ID 토큰을 받는 흐름은 구글 버튼으로만 시작할 수 있어 직접 만든 버튼을 쓰지 않는다
export function GoogleSignInButton({ onIdToken, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<View>(null);
  const onIdTokenRef = useRef(onIdToken);
  onIdTokenRef.current = onIdToken;

  useEffect(() => {
    if (!WEB_CLIENT_ID) return;
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
        });
      })
      // 스크립트를 못 불러오면(차단·오프라인) 버튼만 보이지 않고 이메일 로그인은 그대로 쓸 수 있다
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isGoogleSignInAvailable) return null;

  return (
    <View
      ref={containerRef}
      className="min-h-[44px] w-full items-center"
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
    />
  );
}
