import TiptapPlaceholder from '@tiptap/extension-placeholder';
import TiptapStarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { Node, type AnyExtension } from '@tiptap/core';
import * as React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const EMPTY_HTML = '<p></p>';
const TOOLBAR_BORDER_COLOR = '#D7DCE2';
const TOOLBAR_ACTIVE_BACKGROUND = '#EDEFF2';
const TOOLBAR_DISABLED_COLOR = '#AEB2B6';
const TOOLBAR_TEXT_COLOR = '#111111';
const EDITOR_TOP_PADDING = 14;
const EDITOR_HORIZONTAL_PADDING = 16;
const EDITOR_BOTTOM_PADDING = 12;
const EDITOR_BLOCK_SPACING = 10;

export type PostEditorValue = {
  html: string;
  text: string;
};

export type PostEditorHandle = {
  blur: () => void;
  focus: () => void;
  getHtml: () => Promise<string>;
  getText: () => Promise<string>;
  setHtml: (nextHtml: string) => void;
};

export type PostEditorProps = {
  autoFocus?: boolean;
  editable?: boolean;
  initialHtml?: string;
  onChange?: (value: PostEditorValue) => void;
  placeholder?: string;
  shouldHideDisabledToolbarItems?: boolean;
  style?: StyleProp<ViewStyle>;
  toolbarHidden?: boolean;
  toolbarItems?: unknown[];
};

type ToolbarButtonProps = {
  active?: boolean;
  icon?: ToolbarIconName;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  title: string;
};

type ToolbarIconName = 'bulletList' | 'orderedList' | 'blockquote' | 'undo' | 'redo';
type HeadingLevel = 1 | 2 | 3;

const TiptapImage = Node.create({
  name: 'image',

  group: 'block',

  draggable: false,

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
});

type TiptapCommandChain = {
  blur: () => TiptapCommandChain;
  focus: () => TiptapCommandChain;
  redo: () => TiptapCommandChain;
  run: () => boolean;
  toggleBlockquote: () => TiptapCommandChain;
  toggleBold: () => TiptapCommandChain;
  toggleBulletList: () => TiptapCommandChain;
  toggleCode: () => TiptapCommandChain;
  toggleCodeBlock: () => TiptapCommandChain;
  toggleHeading: (attributes: { level: HeadingLevel }) => TiptapCommandChain;
  toggleItalic: () => TiptapCommandChain;
  toggleOrderedList: () => TiptapCommandChain;
  toggleStrike: () => TiptapCommandChain;
  setHorizontalRule: () => TiptapCommandChain;
  toggleUnderline: () => TiptapCommandChain;
  undo: () => TiptapCommandChain;
};

function normalizeHtml(value?: string) {
  return value?.trim() ? value : EMPTY_HTML;
}

function emitEditorChange(editor: Editor, onChange?: (value: PostEditorValue) => void) {
  onChange?.({
    html: normalizeHtml(editor.getHTML()),
    text: editor.getText(),
  });
}

function commandChain(editor: Editor) {
  return editor.chain().focus() as unknown as TiptapCommandChain;
}

function canRun(editor: Editor, command: (chain: TiptapCommandChain) => TiptapCommandChain) {
  return command(editor.can().chain().focus() as unknown as TiptapCommandChain).run();
}

function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  const commonProps = {
    fill: 'none',
    height: 18,
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    width: 18,
  };

  if (name === 'bulletList') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <circle cx="5" cy="7" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="5" cy="17" r="1.2" fill="currentColor" stroke="none" />
        <path d="M9 7h10M9 12h10M9 17h10" />
      </svg>
    );
  }

  if (name === 'orderedList') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M10 6h10M10 12h10M10 18h10" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
        <path d="M4 14h2l-2 4h2" />
      </svg>
    );
  }

  if (name === 'blockquote') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M7 8h6" />
        <path d="M7 12h10" />
        <path d="M7 16h8" />
        <path d="M4 6v12" />
      </svg>
    );
  }

  if (name === 'undo') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M9 7 5 11l4 4" />
        <path d="M5 11h9a5 5 0 0 1 0 10h-1" />
      </svg>
    );
  }

  return (
    <svg {...commonProps} aria-hidden="true">
      <path d="m15 7 4 4-4 4" />
      <path d="M19 11H10a5 5 0 0 0 0 10h1" />
    </svg>
  );
}

function ToolbarButton({ active, disabled, icon, label, onPress, title }: ToolbarButtonProps) {
  const content = icon ? <ToolbarIcon name={icon} /> : label;

  if (disabled) {
    return (
      <button
        type="button"
        aria-label={title}
        title={title}
        disabled
        style={{
          ...toolbarButtonStyle,
          color: TOOLBAR_DISABLED_COLOR,
          cursor: 'default',
          opacity: 0.65,
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      style={{
        ...toolbarButtonStyle,
        backgroundColor: active ? TOOLBAR_ACTIVE_BACKGROUND : '#FFFFFF',
        color: TOOLBAR_TEXT_COLOR,
      }}
    >
      {content}
    </button>
  );
}

function EditorToolbar({
  editor,
  shouldHideDisabledToolbarItems,
}: {
  editor: Editor;
  shouldHideDisabledToolbarItems?: boolean;
}) {
  const items: ToolbarButtonProps[] = [
    {
      label: 'B',
      title: 'Bold',
      active: editor.isActive('bold'),
      disabled: !canRun(editor, (chain) => chain.toggleBold()),
      onPress: () => commandChain(editor).toggleBold().run(),
    },
    {
      label: 'I',
      title: 'Italic',
      active: editor.isActive('italic'),
      disabled: !canRun(editor, (chain) => chain.toggleItalic()),
      onPress: () => commandChain(editor).toggleItalic().run(),
    },
    {
      label: 'U',
      title: 'Underline',
      active: editor.isActive('underline'),
      disabled: !canRun(editor, (chain) => chain.toggleUnderline()),
      onPress: () => commandChain(editor).toggleUnderline().run(),
    },
    {
      label: 'S',
      title: 'Strike',
      active: editor.isActive('strike'),
      disabled: !canRun(editor, (chain) => chain.toggleStrike()),
      onPress: () => commandChain(editor).toggleStrike().run(),
    },
    {
      label: 'H1',
      title: 'Heading 1',
      active: editor.isActive('heading', { level: 1 }),
      disabled: !canRun(editor, (chain) => chain.toggleHeading({ level: 1 })),
      onPress: () => commandChain(editor).toggleHeading({ level: 1 }).run(),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      active: editor.isActive('heading', { level: 2 }),
      disabled: !canRun(editor, (chain) => chain.toggleHeading({ level: 2 })),
      onPress: () => commandChain(editor).toggleHeading({ level: 2 }).run(),
    },
    {
      icon: 'bulletList',
      label: 'UL',
      title: 'Bullet list',
      active: editor.isActive('bulletList'),
      disabled: !canRun(editor, (chain) => chain.toggleBulletList()),
      onPress: () => commandChain(editor).toggleBulletList().run(),
    },
    {
      icon: 'orderedList',
      label: 'OL',
      title: 'Ordered list',
      active: editor.isActive('orderedList'),
      disabled: !canRun(editor, (chain) => chain.toggleOrderedList()),
      onPress: () => commandChain(editor).toggleOrderedList().run(),
    },
    {
      icon: 'blockquote',
      label: 'BQ',
      title: 'Blockquote',
      active: editor.isActive('blockquote'),
      disabled: !canRun(editor, (chain) => chain.toggleBlockquote()),
      onPress: () => commandChain(editor).toggleBlockquote().run(),
    },
    {
      label: '<>',
      title: 'Inline code',
      active: editor.isActive('code'),
      disabled: !canRun(editor, (chain) => chain.toggleCode()),
      onPress: () => commandChain(editor).toggleCode().run(),
    },
    {
      label: '</>',
      title: 'Code block',
      active: editor.isActive('codeBlock'),
      disabled: !canRun(editor, (chain) => chain.toggleCodeBlock()),
      onPress: () => commandChain(editor).toggleCodeBlock().run(),
    },
    {
      label: 'HR',
      title: 'Horizontal rule',
      disabled: !canRun(editor, (chain) => chain.setHorizontalRule()),
      onPress: () => commandChain(editor).setHorizontalRule().run(),
    },
    {
      icon: 'undo',
      label: 'Undo',
      title: 'Undo',
      disabled: !canRun(editor, (chain) => chain.undo()),
      onPress: () => commandChain(editor).undo().run(),
    },
    {
      icon: 'redo',
      label: 'Redo',
      title: 'Redo',
      disabled: !canRun(editor, (chain) => chain.redo()),
      onPress: () => commandChain(editor).redo().run(),
    },
  ];

  const visibleItems = shouldHideDisabledToolbarItems
    ? items.filter((item) => !item.disabled)
    : items;

  return (
    <div style={toolbarStyle}>
      {visibleItems.map((item) => (
        <ToolbarButton key={item.title} {...item} />
      ))}
    </div>
  );
}

export const PostEditor = React.forwardRef<PostEditorHandle, PostEditorProps>(function PostEditor(
  {
    autoFocus = false,
    editable = true,
    initialHtml,
    onChange,
    placeholder = 'Write your post here.',
    shouldHideDisabledToolbarItems = false,
    style,
    toolbarHidden,
  },
  ref
) {
  const initialContent = React.useMemo(() => normalizeHtml(initialHtml), [initialHtml]);
  const lastAppliedHtmlRef = React.useRef(initialContent);
  const extensions = React.useMemo(
    () =>
      [
        TiptapStarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        TiptapImage,
        TiptapPlaceholder.configure({
          placeholder,
        }),
      ] as unknown as AnyExtension[],
    [placeholder]
  );

  const editor = useEditor({
    autofocus: autoFocus,
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        'aria-label': placeholder,
        class: 'thingo-post-editor-content',
      },
    },
    extensions,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      lastAppliedHtmlRef.current = normalizeHtml(nextEditor.getHTML());
      emitEditorChange(nextEditor, onChange);
    },
  } as Parameters<typeof useEditor>[0]);

  React.useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  React.useEffect(() => {
    if (!editor) return;

    const nextHtml = normalizeHtml(initialHtml);
    if (nextHtml === lastAppliedHtmlRef.current) return;

    editor.commands.setContent(nextHtml);
    lastAppliedHtmlRef.current = nextHtml;
  }, [editor, initialHtml]);

  React.useImperativeHandle(
    ref,
    () => ({
      blur: () => {
        editor?.commands.blur();
      },
      focus: () => {
        editor?.commands.focus();
      },
      getHtml: async () => normalizeHtml(editor?.getHTML()),
      getText: async () => editor?.getText() ?? '',
      setHtml: (nextHtml: string) => {
        const normalized = normalizeHtml(nextHtml);
        lastAppliedHtmlRef.current = normalized;
        editor?.commands.setContent(normalized);
      },
    }),
    [editor]
  );

  return (
    <View style={[styles.container, style]}>
      <style>{editorCss}</style>
      <div style={editorShellStyle}>
        <EditorContent editor={editor} />
      </div>

      {editor && !toolbarHidden ? (
        <EditorToolbar
          editor={editor}
          shouldHideDisabledToolbarItems={shouldHideDisabledToolbarItems}
        />
      ) : null}
    </View>
  );
});

const toolbarStyle: React.CSSProperties = {
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderTop: `1px solid ${TOOLBAR_BORDER_COLOR}`,
  bottom: 0,
  display: 'flex',
  gap: 4,
  left: 0,
  minHeight: 44,
  overflowX: 'auto',
  padding: '6px 8px',
  position: 'absolute',
  right: 0,
};

const toolbarButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: 14,
  fontWeight: 700,
  height: 32,
  justifyContent: 'center',
  lineHeight: 1,
  minWidth: 32,
  padding: '0 8px',
};

const editorShellStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  flex: 1,
  minHeight: 280,
  overflow: 'auto',
  paddingBottom: 52,
};

const editorCss = `
  .thingo-post-editor-content {
    box-sizing: border-box;
    color: #1a1f24;
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
    font-size: 14px;
    line-height: 1.5;
    min-height: 280px;
    outline: none;
    padding: ${EDITOR_TOP_PADDING}px ${EDITOR_HORIZONTAL_PADDING}px ${EDITOR_BOTTOM_PADDING}px;
    white-space: pre-wrap;
  }

  .thingo-post-editor-content p,
  .thingo-post-editor-content h1,
  .thingo-post-editor-content h2,
  .thingo-post-editor-content h3,
  .thingo-post-editor-content blockquote,
  .thingo-post-editor-content ul,
  .thingo-post-editor-content ol,
  .thingo-post-editor-content pre {
    margin: 0;
  }

  .thingo-post-editor-content h1 {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.35;
  }

  .thingo-post-editor-content h2 {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }

  .thingo-post-editor-content h3 {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }

  .thingo-post-editor-content > * + * {
    margin-top: ${EDITOR_BLOCK_SPACING}px;
  }

  .thingo-post-editor-content ul,
  .thingo-post-editor-content ol {
    list-style-position: outside;
    padding-left: 1.5em;
  }

  .thingo-post-editor-content ul {
    list-style-type: disc;
  }

  .thingo-post-editor-content ol {
    list-style-type: decimal;
  }

  .thingo-post-editor-content li {
    display: list-item;
    padding-left: 0.125em;
  }

  .thingo-post-editor-content li > p {
    display: inline;
  }

  .thingo-post-editor-content blockquote {
    border-left: 3px solid #cdd0d4;
    color: #5f666f;
    padding-left: 10px;
  }

  .thingo-post-editor-content code {
    background-color: #f1f3f5;
    border-radius: 4px;
    color: #1a1f24;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 13px;
    padding: 2px 4px;
  }

  .thingo-post-editor-content pre {
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

  .thingo-post-editor-content pre code {
    background-color: transparent;
    border-radius: 0;
    font-size: inherit;
    padding: 0;
  }

  .thingo-post-editor-content hr {
    border: 0;
    border-top: 1px solid #d7dce2;
    margin: 12px 0;
  }

  .thingo-post-editor-content img {
    display: block;
    height: auto;
    max-width: 100%;
  }

  .thingo-post-editor-content p.is-editor-empty:first-child::before {
    color: #909499;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    position: 'relative',
  },
});
