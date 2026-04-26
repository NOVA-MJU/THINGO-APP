import * as React from 'react';

interface Props {
  videoId: string;
  height: number;
}

export function YoutubeEmbed({ videoId, height }: Props) {
  return (
    <iframe
      width="100%"
      height={height}
      src={`https://www.youtube.com/embed/${videoId}`}
      style={{ border: 'none' }}
      allowFullScreen
    />
  );
}
