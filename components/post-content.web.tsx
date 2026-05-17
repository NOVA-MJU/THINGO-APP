import * as React from 'react';
import type { CSSProperties } from 'react';

type PostContentProps = {
  content?: string;
  style?: CSSProperties;
};

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function plainTextToHtml(text: string) {
  if (!text.trim()) return '<p></p>';

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function normalizeContent(content?: string) {
  if (!content?.trim()) return '<p></p>';
  return looksLikeHtml(content) ? content : plainTextToHtml(content);
}

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
      dangerouslySetInnerHTML={{ __html: normalizeContent(content) }}
    />
  );
}
