import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const siteTitle = '명지대학교 통합 정보 탐색 플랫폼, 띵고 Thingo';
const siteUrl = 'https://thingo.kr';
const openGraphImage = `${siteUrl}/open-graph.png`;

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className="bg-background">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          페이지마다 값이 달라져야 하는 태그는 여기서 넣지 않는다.
          이 파일의 태그는 helmet(expo-router/head)이 관리하지 않아서,
          각 페이지가 <Head>로 같은 태그를 넣으면 두 개가 되어버린다.
          아래 태그들은 app/_layout.tsx의 <Head>에 기본값이 있고 각 페이지가 덮어쓴다.
            - name="description"
            - og:title  (전 페이지가 같으면 페이지별 <title>과 신호가 충돌해서
                         구글이 검색 결과 제목을 og:title 쪽으로 골라버릴 수 있다)
            - og:description
            - og:url    (canonical과 같은 경로를 가리켜야 공유 링크가 홈으로 쏠리지 않는다)
          twitter:title / twitter:description은 없으면 og:* 로 대체되므로 따로 두지 않는다
        */}

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="og:image" content={openGraphImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={openGraphImage} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body className="bg-grey-02">{children}</body>
    </html>
  );
}
