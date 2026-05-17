import * as React from 'react';

export interface YoutubeEmbedProps {
  videoId: string;
  height: number;
}

export function YoutubeEmbed({ videoId, height }: YoutubeEmbedProps) {
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
