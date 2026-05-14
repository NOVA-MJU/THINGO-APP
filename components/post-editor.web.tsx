import * as React from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

const EMPTY_HTML = '<p></p>';

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

function stripHtml(html?: string) {
  if (!html?.trim()) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function textToHtml(text: string) {
  if (!text.trim()) return EMPTY_HTML;

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export const PostEditor = React.forwardRef<PostEditorHandle, PostEditorProps>(function PostEditor(
  {
    autoFocus = false,
    editable = true,
    initialHtml,
    onChange,
    placeholder = '자유롭게 말을 남겨보세요',
    style,
  },
  ref
) {
  const inputRef = React.useRef<TextInput>(null);
  const [text, setText] = React.useState(() => stripHtml(initialHtml));

  React.useEffect(() => {
    setText(stripHtml(initialHtml));
  }, [initialHtml]);

  const emitChange = React.useCallback(
    (nextText: string) => {
      onChange?.({
        html: textToHtml(nextText),
        text: nextText,
      });
    },
    [onChange]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      blur: () => {
        inputRef.current?.blur();
      },
      focus: () => {
        inputRef.current?.focus();
      },
      getHtml: async () => {
        return textToHtml(text);
      },
      getText: async () => {
        return text;
      },
      setHtml: (nextHtml: string) => {
        const nextText = stripHtml(nextHtml);
        setText(nextText);
        emitChange(nextText);
      },
    }),
    [emitChange, text]
  );

  return (
    <View style={[styles.container, style]}>
      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        editable={editable}
        multiline
        placeholder={placeholder}
        style={styles.input}
        textAlignVertical="top"
        value={text}
        onChangeText={(nextText) => {
          setText(nextText);
          emitChange(nextText);
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 280,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
