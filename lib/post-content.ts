type RichTextStyles = {
  bold?: boolean;
  backgroundColor?: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
  href?: string;
  link?: string;
};

type RichTextSpan = {
  type?: string;
  text?: string;
  styles?: RichTextStyles;
};

type RichBlockProps = {
  backgroundColor?: string;
  level?: number;
  textAlignment?: string;
  textColor?: string;
  checked?: boolean;
  url?: string;
  caption?: string;
  name?: string;
  previewWidth?: number;
  showPreview?: boolean;
};

type RichBlock = {
  id?: string;
  type?: string;
  props?: RichBlockProps;
  content?: RichTextSpan[];
  children?: RichBlock[];
};

type HtmlNode = {
  attributes?: Record<string, string | true>;
  children: HtmlNode[];
  tagName?: string;
  text?: string;
  type: 'element' | 'root' | 'text';
};

const EMPTY_HTML = '<p></p>';
const VALID_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
]);

export function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export function plainTextToHtml(text: string) {
  if (!text.trim()) return EMPTY_HTML;

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function buildContentPreview(text: string, maxLength = 120) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function serializePostContentForStorage(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return JSON.stringify(normalizeRichBlocksForStorage([{ type: 'paragraph' }]));

  const parsedBlocks = parseRichBlocks(trimmed);
  if (parsedBlocks) return JSON.stringify(normalizeRichBlocksForStorage(parsedBlocks));

  const blocks = looksLikeHtml(trimmed)
    ? htmlToRichBlocks(trimmed)
    : plainTextToRichBlocks(trimmed);

  return JSON.stringify(
    normalizeRichBlocksForStorage(blocks.length > 0 ? blocks : [{ type: 'paragraph' }])
  );
}

function plainTextToRichBlocks(text: string): RichBlock[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph.replace(/\n/g, '\n') }],
    }));
}

function htmlToRichBlocks(html: string): RichBlock[] {
  return nodesToBlocks(parseHtml(html).children);
}

function parseHtml(html: string): HtmlNode {
  const root: HtmlNode = { type: 'root', children: [] };
  const stack: HtmlNode[] = [root];
  const tokens = html.match(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (!token || token.startsWith('<!--')) continue;

    const parent = stack[stack.length - 1];

    if (!token.startsWith('<')) {
      parent.children.push({ type: 'text', text: decodeHtml(token), children: [] });
      continue;
    }

    if (/^<\//.test(token)) {
      const tagName = token.replace(/^<\//, '').replace(/>$/, '').trim().toLowerCase();

      while (stack.length > 1) {
        const current = stack.pop();
        if (current?.tagName === tagName) break;
      }

      continue;
    }

    const parsedTag = parseOpeningTag(token);
    if (!parsedTag) continue;

    const node: HtmlNode = {
      type: 'element',
      tagName: parsedTag.tagName,
      attributes: parsedTag.attributes,
      children: [],
    };

    parent.children.push(node);

    if (!parsedTag.selfClosing && !VOID_TAGS.has(parsedTag.tagName)) {
      stack.push(node);
    }
  }

  return root;
}

function parseOpeningTag(token: string) {
  const tagBody = token.replace(/^</, '').replace(/>$/, '').trim();
  const selfClosing = tagBody.endsWith('/');
  const normalizedTagBody = selfClosing ? tagBody.slice(0, -1).trim() : tagBody;
  const tagMatch = normalizedTagBody.match(/^([^\s/>]+)/);

  if (!tagMatch) return null;

  const tagName = tagMatch[1].toLowerCase();
  const attributes: Record<string, string | true> = {};
  const attributeSource = normalizedTagBody.slice(tagMatch[0].length);
  const attributePattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attributeSource))) {
    const [, name, doubleQuotedValue, singleQuotedValue, unquotedValue] = match;
    attributes[name.toLowerCase()] =
      decodeHtml(doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? '') || true;
  }

  return { attributes, selfClosing, tagName };
}

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function nodesToBlocks(nodes: HtmlNode[]): RichBlock[] {
  return nodes.flatMap(nodeToBlocks).filter((block) => hasRenderableBlockContent(block));
}

function nodeToBlocks(node: HtmlNode): RichBlock[] {
  if (node.type === 'text') {
    const text = node.text?.trim();
    return text ? [{ type: 'paragraph', content: [{ type: 'text', text }] }] : [];
  }

  if (node.type === 'root') return nodesToBlocks(node.children);

  switch (node.tagName) {
    case 'p':
      return [createTextBlock('paragraph', node)];
    case 'h1':
    case 'h2':
    case 'h3':
      return [
        createTextBlock('heading', node, {
          level: Number(node.tagName.slice(1)),
        }),
      ];
    case 'blockquote':
      return [createTextBlock('quote', node)];
    case 'pre':
      return [{ type: 'codeBlock', content: [{ type: 'text', text: collectText(node) }] }];
    case 'figure':
    case 'img': {
      const imageBlock = createImageBlock(node);
      return imageBlock ? [imageBlock] : [];
    }
    case 'hr':
      return [{ type: 'horizontalRule' }];
    case 'ul':
    case 'ol':
      return listNodeToBlocks(node);
    case 'div':
    case 'section':
    case 'article':
      return nodesToBlocks(node.children);
    default: {
      const inlineContent = collectInlineContent([node]);
      return inlineContent.length > 0 ? [{ type: 'paragraph', content: inlineContent }] : [];
    }
  }
}

function createTextBlock(type: string, node: HtmlNode, props?: RichBlockProps): RichBlock {
  return {
    type,
    props,
    content: collectInlineContent(node.children),
  };
}

function createImageBlock(node: HtmlNode): RichBlock | null {
  const imageNode = node.tagName === 'img' ? node : findFirstElement(node, 'img');
  const url = getAttribute(imageNode, 'src');

  if (!url) return null;

  const captionNode = node.tagName === 'figure' ? findFirstElement(node, 'figcaption') : null;
  const caption = captionNode ? collectText(captionNode).trim() : undefined;

  return {
    type: 'image',
    props: {
      url,
      caption,
    },
  };
}

function listNodeToBlocks(node: HtmlNode): RichBlock[] {
  const type = getListItemType(node);

  return node.children
    .filter((child) => child.type === 'element' && child.tagName === 'li')
    .map((item) => ({
      type,
      props: type === 'checkListItem' ? { checked: isCheckedListItem(item) } : undefined,
      content: collectInlineContent(item.children.filter((child) => !isListNode(child))),
      children: nodesToBlocks(item.children.filter(isListNode)),
    }));
}

function getListItemType(node: HtmlNode) {
  if (node.tagName === 'ol') return 'numberedListItem';
  if (isTaskList(node)) return 'checkListItem';
  return 'bulletListItem';
}

function isTaskList(node: HtmlNode) {
  const dataType = getAttribute(node, 'data-type');
  const className = getAttribute(node, 'class');
  return dataType === 'taskList' || className?.split(/\s+/).includes('task-list');
}

function isCheckedListItem(node: HtmlNode) {
  const dataChecked = getAttribute(node, 'data-checked');
  const ariaChecked = getAttribute(node, 'aria-checked');
  const input = findFirstElement(node, 'input');
  const inputChecked = getAttribute(input, 'checked');

  return dataChecked === 'true' || ariaChecked === 'true' || inputChecked !== undefined;
}

function isListNode(node: HtmlNode) {
  return node.type === 'element' && (node.tagName === 'ul' || node.tagName === 'ol');
}

function collectInlineContent(nodes: HtmlNode[], styles: RichTextStyles = {}): RichTextSpan[] {
  return mergeAdjacentSpans(
    nodes.flatMap((node) => {
      if (node.type === 'text') {
        if (!node.text) return [];
        return [{ type: 'text', text: node.text, styles: cleanStyles(styles) }];
      }

      if (node.type !== 'element') return collectInlineContent(node.children, styles);

      if (node.tagName === 'br') {
        return [{ type: 'text', text: '\n', styles: cleanStyles(styles) }];
      }

      if (node.tagName === 'img' || node.tagName === 'input') return [];

      const nextStyles = getNextInlineStyles(node, styles);
      return collectInlineContent(node.children, nextStyles);
    })
  );
}

function getNextInlineStyles(node: HtmlNode, styles: RichTextStyles) {
  const nextStyles = { ...styles };

  if (node.tagName === 'strong' || node.tagName === 'b') nextStyles.bold = true;
  if (node.tagName === 'em' || node.tagName === 'i') nextStyles.italic = true;
  if (node.tagName === 'u') nextStyles.underline = true;
  if (node.tagName === 's' || node.tagName === 'strike' || node.tagName === 'del') {
    nextStyles.strike = true;
  }
  if (node.tagName === 'code') nextStyles.code = true;

  const href = node.tagName === 'a' ? getAttribute(node, 'href') : undefined;
  if (href) nextStyles.href = href;

  return nextStyles;
}

function cleanStyles(styles: RichTextStyles) {
  return Object.keys(styles).length > 0 ? styles : undefined;
}

function mergeAdjacentSpans(spans: RichTextSpan[]) {
  return spans.reduce<RichTextSpan[]>((result, span) => {
    if (!span.text) return result;

    const previous = result[result.length - 1];
    if (previous && JSON.stringify(previous.styles) === JSON.stringify(span.styles)) {
      previous.text = `${previous.text ?? ''}${span.text}`;
      return result;
    }

    result.push({ ...span });
    return result;
  }, []);
}

function findFirstElement(node: HtmlNode | null | undefined, tagName: string): HtmlNode | null {
  if (!node) return null;
  if (node.type === 'element' && node.tagName === tagName) return node;

  for (const child of node.children) {
    const match = findFirstElement(child, tagName);
    if (match) return match;
  }

  return null;
}

function getAttribute(node: HtmlNode | null | undefined, name: string) {
  const value = node?.attributes?.[name.toLowerCase()];
  if (value === true) return '';
  return value;
}

function collectText(node: HtmlNode): string {
  if (node.type === 'text') return node.text ?? '';
  return node.children.map(collectText).join('');
}

function hasRenderableBlockContent(block: RichBlock) {
  if (block.type === 'image' || block.type === 'horizontalRule') return true;
  if (block.children?.some(hasRenderableBlockContent)) return true;
  return block.content?.some((span) => span.text?.trim()) ?? false;
}

function normalizeRichBlocksForStorage(blocks: RichBlock[]) {
  return blocks.map((block, index) => normalizeRichBlockForStorage(block, `${index}`));
}

function normalizeRichBlockForStorage(block: RichBlock, path: string): RichBlock {
  const type = getStorageBlockType(block.type);

  return {
    id: block.id ?? createBlockId(path),
    type,
    props: getStorageBlockProps(type, block.props),
    content: normalizeStorageInlineContent(block.content, block.type),
    children: Array.isArray(block.children)
      ? block.children.map((child, index) =>
          normalizeRichBlockForStorage(child, `${path}-${index}`)
        )
      : [],
  };
}

function createBlockId(path: string) {
  return `thingo-app-${path}`;
}

function getStorageBlockType(type?: string) {
  if (type === 'heading') return 'paragraph';
  if (type === 'blockquote') return 'quote';
  return type ?? 'paragraph';
}

function getStorageBlockProps(type: string, props?: RichBlockProps): RichBlockProps {
  const baseProps = {
    backgroundColor: props?.backgroundColor ?? 'default',
    textColor: props?.textColor ?? 'default',
    textAlignment: props?.textAlignment ?? 'left',
  };

  if (type === 'heading') {
    return {
      ...baseProps,
      level: Math.min(3, Math.max(1, Number(props?.level) || 1)),
    };
  }

  if (type === 'checkListItem') {
    return {
      ...baseProps,
      checked: props?.checked === true,
    };
  }

  if (type === 'image') {
    return {
      ...baseProps,
      url: props?.url ?? '',
      caption: props?.caption ?? '',
      name: props?.name ?? '',
      previewWidth: props?.previewWidth ?? 512,
      showPreview: props?.showPreview ?? true,
    };
  }

  return baseProps;
}

function normalizeStorageInlineContent(content?: RichTextSpan[], sourceType?: string) {
  if (!Array.isArray(content)) return [];

  return content
    .filter((span) => typeof span?.text === 'string')
    .map((span) => ({
      type: span.type ?? 'text',
      text: span.text ?? '',
      styles: sourceType === 'heading' ? { ...span.styles, bold: true } : (span.styles ?? {}),
    }));
}

function parseRichBlocks(content: string): RichBlock[] | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('[')) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return null;
    return parsed as RichBlock[];
  } catch {
    return null;
  }
}

function alignmentStyle(textAlignment?: string) {
  if (!textAlignment || !VALID_ALIGNMENTS.has(textAlignment)) return '';
  return ` style="text-align:${textAlignment}"`;
}

function applySpanStyles(text: string, styles?: RichTextStyles) {
  let result = text.replace(/\n/g, '<br />');

  if (styles?.code) result = `<code>${result}</code>`;
  if (styles?.bold) result = `<strong>${result}</strong>`;
  if (styles?.italic) result = `<em>${result}</em>`;
  if (styles?.underline) result = `<u>${result}</u>`;
  if (styles?.strike) result = `<s>${result}</s>`;

  const href = styles?.href ?? styles?.link;
  if (href) {
    result = `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${result}</a>`;
  }

  return result;
}

function renderInlineContent(content?: RichTextSpan[]) {
  if (!Array.isArray(content) || content.length === 0) return '';

  return content
    .map((span) => {
      if (typeof span?.text !== 'string') return '';
      return applySpanStyles(escapeHtml(span.text), span.styles);
    })
    .join('');
}

function renderImageBlock(block: RichBlock) {
  const url = block.props?.url;
  if (!url) return '';

  const caption = block.props?.caption?.trim();
  const captionHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';

  return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(caption ?? '게시글 이미지')}" />${captionHtml}</figure>`;
}

function renderListItem(block: RichBlock) {
  const inlineHtml = renderInlineContent(block.content);
  const childrenHtml = renderBlocks(block.children);
  const checked = block.type === 'checkListItem' ? block.props?.checked === true : null;
  const checkboxHtml = checked === null ? '' : `<span>${checked ? '&#x2611;' : '&#x2610;'}</span> `;

  return `<li>${checkboxHtml}${inlineHtml || '<br />'}${childrenHtml}</li>`;
}

function renderBlock(block: RichBlock) {
  const inlineHtml = renderInlineContent(block.content);
  const childrenHtml = renderBlocks(block.children);
  const align = alignmentStyle(block.props?.textAlignment);

  switch (block.type) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(block.props?.level) || 1));
      return `<h${level}${align}>${inlineHtml || '<br />'}</h${level}>${childrenHtml}`;
    }
    case 'paragraph':
      return `<p${align}>${inlineHtml || '<br />'}</p>${childrenHtml}`;
    case 'blockquote':
    case 'quote':
      return `<blockquote${align}>${inlineHtml || '<br />'}</blockquote>${childrenHtml}`;
    case 'codeBlock':
      return `<pre><code>${inlineHtml || '<br />'}</code></pre>${childrenHtml}`;
    case 'horizontalRule':
      return `<hr />${childrenHtml}`;
    case 'image':
      return renderImageBlock(block);
    default:
      if (inlineHtml || childrenHtml) {
        return `<p${align}>${inlineHtml || '<br />'}</p>${childrenHtml}`;
      }
      return '';
  }
}

function renderBlocks(blocks?: RichBlock[]) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';

  const rendered: string[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (
      block.type === 'bulletListItem' ||
      block.type === 'numberedListItem' ||
      block.type === 'checkListItem'
    ) {
      const listTag = block.type === 'numberedListItem' ? 'ol' : 'ul';
      const items: string[] = [];

      while (index < blocks.length && blocks[index]?.type === block.type) {
        items.push(renderListItem(blocks[index]));
        index += 1;
      }

      rendered.push(`<${listTag}>${items.join('')}</${listTag}>`);
      index -= 1;
      continue;
    }

    rendered.push(renderBlock(block));
  }

  return rendered.join('');
}

export function richBlocksToHtml(content: string) {
  const blocks = parseRichBlocks(content);
  if (!blocks) return null;

  const html = renderBlocks(blocks).trim();
  return html || EMPTY_HTML;
}

export function normalizePostContent(content?: string) {
  if (!content?.trim()) return EMPTY_HTML;

  const richBlockHtml = richBlocksToHtml(content);
  if (richBlockHtml) return richBlockHtml;

  if (looksLikeHtml(content)) return content;

  return plainTextToHtml(content);
}
