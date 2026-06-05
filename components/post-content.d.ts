import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type PostContentProps = {
  content?: string;
  style?: StyleProp<ViewStyle>;
};

export declare function PostContent(props: PostContentProps): React.ReactElement | null;
