import * as React from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

interface Props {
  videoId: string;
  height: number;
}

export function YoutubeEmbed({ videoId, height }: Props) {
  return <YoutubePlayer height={height} videoId={videoId} />;
}
