import {
  editorHtml,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  type ToolbarItem,
  useBridgeState,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const EMPTY_HTML = '<p></p>';
const EDITOR_TOP_PADDING = 14;
const EDITOR_HORIZONTAL_PADDING = 16;
const EDITOR_BOTTOM_PADDING = 12;
const EDITOR_BLOCK_SPACING = 10;
const TOOLBAR_ICON_COLOR = '#111111';
const TOOLBAR_DISABLED_ICON_COLOR = '#8A8F98';
const TOOLBAR_BORDER_COLOR = '#D7DCE2';
const TOOLBAR_ACTIVE_BACKGROUND = '#EDEFF2';

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
  toolbarItems?: ToolbarItem[];
};

function normalizeHtml(value?: string) {
  return value?.trim() ? value : EMPTY_HTML;
}

export const PostEditor = React.forwardRef<PostEditorHandle, PostEditorProps>(function PostEditor(
  {
    autoFocus = false,
    editable = true,
    initialHtml,
    onChange,
    placeholder = '자유롭게 말을 남겨보세요.',
    shouldHideDisabledToolbarItems = false,
    style,
    toolbarHidden,
    toolbarItems,
  },
  ref
) {
  const initialContent = React.useMemo(() => normalizeHtml(initialHtml), [initialHtml]);
  const lastAppliedHtmlRef = React.useRef(initialContent);
  const lastPlaceholderRef = React.useRef(placeholder);
  const customSource = React.useMemo(
    () =>
      editorHtml.replace(
        /#root div \.ProseMirror\s*\{\s*min-height: 100%;\s*overflow: visible;\s*\}/,
        `#root div .ProseMirror {
      box-sizing: border-box;
      min-height: 100%;
      overflow: visible;
      line-height: 1.5;
      padding: ${EDITOR_TOP_PADDING}px ${EDITOR_HORIZONTAL_PADDING}px ${EDITOR_BOTTOM_PADDING}px;
    }
    #root div .ProseMirror p,
    #root div .ProseMirror h1,
    #root div .ProseMirror h2,
    #root div .ProseMirror h3,
    #root div .ProseMirror blockquote,
    #root div .ProseMirror ul,
    #root div .ProseMirror ol {
      margin: 0;
    }
    #root div .ProseMirror > * + * {
      margin-top: ${EDITOR_BLOCK_SPACING}px;
    }
    #root div .ProseMirror ul,
    #root div .ProseMirror ol {
      padding-left: 1.25em;
    }`
      ),
    []
  );
  const bridgeExtensions = React.useMemo(
    () => [...TenTapStartKit, PlaceholderBridge.configureExtension({ placeholder })],
    [placeholder]
  );
  const theme = React.useMemo(
    () => ({
      toolbar: {
        toolbarBody: {
          backgroundColor: '#FFFFFF',
          borderTopColor: TOOLBAR_BORDER_COLOR,
          borderBottomColor: TOOLBAR_BORDER_COLOR,
        },
        toolbarButton: {
          backgroundColor: '#FFFFFF',
        },
        icon: {
          tintColor: TOOLBAR_ICON_COLOR,
        },
        iconActive: {
          tintColor: TOOLBAR_ICON_COLOR,
        },
        iconDisabled: {
          tintColor: TOOLBAR_DISABLED_ICON_COLOR,
        },
        iconWrapper: {
          backgroundColor: '#FFFFFF',
        },
        iconWrapperActive: {
          backgroundColor: TOOLBAR_ACTIVE_BACKGROUND,
        },
        iconWrapperDisabled: {
          opacity: 0.7,
        },
        linkBarTheme: {
          addLinkContainer: {
            backgroundColor: '#FFFFFF',
            borderTopColor: TOOLBAR_BORDER_COLOR,
            borderBottomColor: TOOLBAR_BORDER_COLOR,
          },
          linkInput: {
            color: TOOLBAR_ICON_COLOR,
          },
          placeholderTextColor: TOOLBAR_DISABLED_ICON_COLOR,
          doneButton: {
            backgroundColor: TOOLBAR_ACTIVE_BACKGROUND,
          },
          doneButtonText: {
            color: TOOLBAR_ICON_COLOR,
          },
        },
      },
    }),
    []
  );

  const editor = useEditorBridge({
    autofocus: autoFocus,
    avoidIosKeyboard: true,
    bridgeExtensions,
    customSource,
    editable,
    initialContent,
    theme,
    onChange: () => {
      // Content extraction is handled by useEditorContent to avoid manual bridge churn.
    },
  });

  const editorState = useBridgeState(editor);
  const html = useEditorContent(editor, {
    debounceInterval: 150,
    type: 'html',
  });
  const text = useEditorContent(editor, {
    debounceInterval: 150,
    type: 'text',
  });

  React.useEffect(() => {
    if (!editorState.isReady) return;
    if (placeholder === lastPlaceholderRef.current) return;

    editor.setPlaceholder(placeholder);
    lastPlaceholderRef.current = placeholder;
  }, [editor, editorState.isReady, placeholder]);

  React.useEffect(() => {
    if (!editorState.isReady) return;

    const nextHtml = normalizeHtml(initialHtml);
    if (nextHtml === lastAppliedHtmlRef.current) return;

    editor.setContent(nextHtml);
    lastAppliedHtmlRef.current = nextHtml;
  }, [editor, editorState.isReady, initialHtml]);

  React.useEffect(() => {
    if (!editorState.isReady) return;
    if (html === undefined || text === undefined) return;

    lastAppliedHtmlRef.current = html;
    onChange?.({
      html,
      text,
    });
  }, [editorState.isReady, html, onChange, text]);

  React.useImperativeHandle(
    ref,
    () => ({
      blur: () => {
        if (!editorState.isReady) return;
        editor.blur();
      },
      focus: () => {
        if (!editorState.isReady) return;
        editor.focus();
      },
      getHtml: async () => {
        if (!editorState.isReady) return normalizeHtml(initialHtml);
        const nextHtml = await editor.getHTML();
        return normalizeHtml(nextHtml);
      },
      getText: async () => {
        if (!editorState.isReady) return '';
        return editor.getText();
      },
      setHtml: (nextHtml: string) => {
        const normalized = normalizeHtml(nextHtml);
        lastAppliedHtmlRef.current = normalized;

        if (!editorState.isReady) return;

        editor.setContent(normalized);
      },
    }),
    [editor, editorState.isReady, initialHtml]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.editorContainer}>
        <RichText editor={editor} style={styles.editor} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.toolbarContainer}
      >
        {editorState.isReady ? (
          <Toolbar
            editor={editor}
            hidden={toolbarHidden}
            items={toolbarItems}
            shouldHideDisabledToolbarItems={shouldHideDisabledToolbarItems}
          />
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
  },
  editor: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
    paddingBottom: 52,
  },
  toolbarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E9EBED',
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
