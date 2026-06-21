import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const siteTitle = 'Thingo';
const siteDescription = '명지대생을 위한 공지, 일정, 식단, 지도, 커뮤니티 통합 플랫폼입니다.';
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
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={openGraphImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={openGraphImage} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
