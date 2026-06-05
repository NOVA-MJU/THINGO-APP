import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ToolbarItem } from '@10play/tentap-editor';

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

export declare const PostEditor: React.ForwardRefExoticComponent<
  PostEditorProps & React.RefAttributes<PostEditorHandle>
>;
