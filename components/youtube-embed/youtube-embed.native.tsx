import * as React from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

export interface YoutubeEmbedProps {
  videoId: string;
  height: number;
}

export function YoutubeEmbed({ videoId, height }: YoutubeEmbedProps) {
  return (
    <YoutubePlayer height={height} videoId={videoId} webViewProps={{ scrollEnabled: false }} />
  );
}
