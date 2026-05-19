import { normalizePostContent } from '@/lib/post-content';
import * as React from 'react';
import type { CSSProperties } from 'react';

type PostContentProps = {
  content?: string;
  style?: CSSProperties;
};

export function PostContent({ content, style }: PostContentProps) {
  return (
    <div
      style={{
        color: '#1a1f24',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
        fontSize: 14,
        lineHeight: 1.75,
        wordBreak: 'break-word',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: normalizePostContent(content) }}
    />
  );
}
