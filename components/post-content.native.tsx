import { normalizePostContent } from '@/lib/post-content';
import * as React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type PostContentProps = {
  content?: string;
  style?: StyleProp<ViewStyle>;
};

const MIN_CONTENT_HEIGHT = 24;

function buildHtmlDocument(content: string) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      :root {
        color-scheme: light;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: transparent;
      }

      body {
        color: #1a1f24;
        font-size: 14px;
        line-height: 1.75;
        font-family:
          -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR",
          "Malgun Gothic", sans-serif;
        overflow: hidden;
        word-break: break-word;
      }

      p,
      h1,
      h2,
      h3,
      blockquote,
      ul,
      ol,
      pre {
        margin: 0;
      }

      body > * + * {
        margin-top: 10px;
      }

      h1,
      h2,
      h3 {
        font-weight: 700;
        line-height: 1.45;
      }

      h1 {
        font-size: 24px;
      }

      h2 {
        font-size: 20px;
      }

      h3 {
        font-size: 18px;
      }

      ul,
      ol {
        padding-left: 20px;
      }

      blockquote {
        border-left: 3px solid #d7dce2;
        color: #59626c;
        padding-left: 12px;
      }

      a {
        color: #4f7eff;
        text-decoration: underline;
      }

      img,
      video {
        display: block;
        height: auto;
        max-width: 100%;
      }

      pre,
      code {
        background: #f4f6f8;
        border-radius: 8px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      }

      pre {
        overflow-x: auto;
        padding: 12px;
        white-space: pre-wrap;
      }

      code {
        padding: 0.15em 0.35em;
      }
    </style>
  </head>
  <body>
    ${content}
    <script>
      (function () {
        var lastHeight = 0;

        function postHeight() {
          var bodyRect = document.body.getBoundingClientRect();
          var nextHeight = Math.max(
            bodyRect.height || 0,
            document.body.offsetHeight || 0,
            document.body.scrollHeight || 0
          );

          if (!nextHeight || nextHeight === lastHeight) {
            return;
          }

          lastHeight = nextHeight;
          window.ReactNativeWebView.postMessage(String(nextHeight));
        }

        if (typeof ResizeObserver === 'function') {
          new ResizeObserver(postHeight).observe(document.body);
        }

        new MutationObserver(postHeight).observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
          characterData: true,
        });

        window.addEventListener('load', postHeight);
        window.addEventListener('resize', postHeight);

        requestAnimationFrame(postHeight);
        setTimeout(postHeight, 0);
        setTimeout(postHeight, 150);
      })();
    </script>
  </body>
</html>`;
}

export function PostContent({ content, style }: PostContentProps) {
  const [height, setHeight] = React.useState(MIN_CONTENT_HEIGHT);

  const source = React.useMemo(() => {
    return { html: buildHtmlDocument(normalizePostContent(content)) };
  }, [content]);

  const handleMessage = React.useCallback((event: WebViewMessageEvent) => {
    const nextHeight = Number(event.nativeEvent.data);

    if (!Number.isFinite(nextHeight)) return;

    setHeight((previousHeight) => {
      const normalizedHeight = Math.max(MIN_CONTENT_HEIGHT, Math.ceil(nextHeight));
      return previousHeight === normalizedHeight ? previousHeight : normalizedHeight;
    });
  }, []);

  return (
    <View style={style}>
      <WebView
        source={source}
        originWhitelist={['*']}
        onMessage={handleMessage}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        style={[styles.webview, { height }]}
        containerStyle={styles.webviewContainer}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  webviewContainer: {
    backgroundColor: 'transparent',
  },
});
