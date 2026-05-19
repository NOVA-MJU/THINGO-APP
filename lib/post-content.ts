type RichTextStyles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  href?: string;
  link?: string;
};

type RichTextSpan = {
  type?: string;
  text?: string;
  styles?: RichTextStyles;
};

type RichBlockProps = {
  level?: number;
  textAlignment?: string;
  checked?: boolean;
  url?: string;
  caption?: string;
};

type RichBlock = {
  type?: string;
  props?: RichBlockProps;
  content?: RichTextSpan[];
  children?: RichBlock[];
};

const EMPTY_HTML = '<p></p>';
const VALID_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

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
  let result = text;

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
      return `<blockquote${align}>${inlineHtml || '<br />'}</blockquote>${childrenHtml}`;
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
