import { normalizePostContent } from '@/lib/post-content';
import * as React from 'react';
import type { CSSProperties } from 'react';

type PostContentProps = {
  content?: string;
  style?: CSSProperties;
};

export function PostContent({ content, style }: PostContentProps) {
  return (
    <>
      <style>{postContentCss}</style>
      <div
        className="thingo-post-content"
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
    </>
  );
}

const postContentCss = `
  .thingo-post-content p,
  .thingo-post-content h1,
  .thingo-post-content h2,
  .thingo-post-content h3,
  .thingo-post-content blockquote,
  .thingo-post-content ul,
  .thingo-post-content ol,
  .thingo-post-content pre {
    margin: 0;
  }

  .thingo-post-content > * + * {
    margin-top: 10px;
  }

  .thingo-post-content > p:first-child:empty,
  .thingo-post-content > p:last-child:empty,
  .thingo-post-content > p:first-child:has(> br:only-child),
  .thingo-post-content > p:last-child:has(> br:only-child) {
    display: none;
  }

  .thingo-post-content h1 {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.35;
  }

  .thingo-post-content h2 {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }

  .thingo-post-content h3 {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }

  .thingo-post-content ul,
  .thingo-post-content ol {
    list-style-position: outside;
    padding-left: 1.5em;
  }

  .thingo-post-content ul {
    list-style-type: disc;
  }

  .thingo-post-content ol {
    list-style-type: decimal;
  }

  .thingo-post-content ul[data-type="taskList"],
  .thingo-post-content ul.task-list {
    list-style: none;
    padding-left: 0;
  }

  .thingo-post-content li[data-type="taskItem"],
  .thingo-post-content li.task-item {
    align-items: flex-start;
    display: flex;
    gap: 8px;
    list-style: none;
    padding-left: 0;
  }

  .thingo-post-content li[data-type="taskItem"]::marker,
  .thingo-post-content li.task-item::marker {
    content: "";
  }

  .thingo-post-content li[data-type="taskItem"] > label,
  .thingo-post-content li.task-item > label {
    align-items: center;
    display: inline-flex;
    flex-shrink: 0;
    min-height: 21px;
  }

  .thingo-post-content li[data-type="taskItem"] > label input,
  .thingo-post-content li.task-item > label input {
    margin: 0;
  }

  .thingo-post-content li[data-type="taskItem"] > div,
  .thingo-post-content li.task-item > div {
    flex: 1;
    min-width: 0;
  }

  .thingo-post-content li[data-type="taskItem"] > div > p,
  .thingo-post-content li.task-item > div > p {
    display: block;
    margin: 0;
  }

  .thingo-post-content li:not([data-type="taskItem"]):not(.task-item) {
    display: list-item;
    padding-left: 0.125em;
  }

  .thingo-post-content li:not([data-type="taskItem"]):not(.task-item) > p {
    display: inline;
  }

  .thingo-post-content blockquote {
    border-left: 3px solid #cdd0d4;
    color: #5f666f;
    padding-left: 10px;
  }

  .thingo-post-content a {
    color: #4f7eff !important;
    font-weight: 700 !important;
    text-decoration: underline !important;
  }

  .thingo-post-content code {
    background-color: #f1f3f5;
    border-radius: 4px;
    color: #1a1f24;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
    padding: 2px 4px;
  }

  .thingo-post-content pre {
    background-color: #f6f7f8;
    border-radius: 8px;
    color: #1a1f24;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
    line-height: 1.5;
    overflow-x: auto;
    padding: 10px 12px;
    white-space: pre;
  }

  .thingo-post-content pre code {
    background-color: transparent;
    border-radius: 0;
    font-size: inherit;
    padding: 0;
  }

  .thingo-post-content hr {
    border: 0;
    border-top: 1px solid #d7dce2;
    margin: 12px 0;
  }

  .thingo-post-content img,
  .thingo-post-content video {
    display: block;
    height: auto;
    max-width: 100%;
  }
`;
