import { ZoomableMedia } from '@/components/maps/reviews/zoomable-media';
import type { PlaceReviewMediaItem } from '@/lib/maps/place-reviews';
import { VideoView, useVideoPlayer } from 'expo-video';
import { PlayIcon, Volume2Icon, VolumeXIcon } from 'lucide-react-native';
import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

export type MediaOrientation = 'portrait' | 'landscape' | 'unknown';

type VideoMediaPlayerProps = {
  mediaItem: PlaceReviewMediaItem;
  isContentSheetOpen: boolean;
  isStoryPaused: boolean;
  mediaTopOffset: number | Animated.AnimatedInterpolation<number>;
  mediaBottomOffset: number | Animated.AnimatedInterpolation<number>;
  muteBottomOffset: number;
  onOrientationChange: (orientation: MediaOrientation) => void;
  onProgress: (progress: number) => void;
  onEnd: () => void;
  onPress: (event: GestureResponderEvent, togglePlayback: () => void) => void;
  onStoryLongPress: () => void;
  onStoryPressOut: () => void;
  onZoomActiveChange: (active: boolean) => void;
  onZoomedChange: (zoomed: boolean) => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

export function VideoMediaPlayer(props: VideoMediaPlayerProps) {
  // 플랫폼별 영상 플레이어 인터페이스 통일
  if (Platform.OS === 'web') {
    return <WebVideoMediaPlayer {...props} />;
  }

  return <NativeVideoMediaPlayer {...props} />;
}

function NativeVideoMediaPlayer({
  mediaItem,
  isContentSheetOpen,
  isStoryPaused,
  mediaTopOffset,
  mediaBottomOffset,
  muteBottomOffset,
  onOrientationChange,
  onProgress,
  onEnd,
  onPress,
  onStoryLongPress,
  onStoryPressOut,
  onZoomActiveChange,
  onZoomedChange,
  onLayout,
}: VideoMediaPlayerProps) {
  const player = useVideoPlayer(mediaItem.url, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = true;
    nextPlayer.timeUpdateEventInterval = 0.25;
    nextPlayer.play();
  });
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [seekBarWidth, setSeekBarWidth] = React.useState(0);
  const endHandledRef = React.useRef(false);
  const wasPlayingBeforeStoryPauseRef = React.useRef(false);

  React.useEffect(() => {
    endHandledRef.current = false;
  }, [mediaItem.url]);

  React.useEffect(() => {
    if (isStoryPaused) {
      wasPlayingBeforeStoryPauseRef.current = !isPaused;
      player.pause();
      return;
    }

    if (wasPlayingBeforeStoryPauseRef.current) {
      wasPlayingBeforeStoryPauseRef.current = false;
      player.play();
    }
  }, [isPaused, isStoryPaused, player]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const nextCurrentTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;
      const nextDuration = Number.isFinite(player.duration) ? player.duration : 0;
      setCurrentTime(nextCurrentTime);
      setDuration(nextDuration);

      if (nextDuration > 0) {
        const progressRatio = Math.max(0, Math.min(1, nextCurrentTime / nextDuration));
        onProgress(progressRatio);

        if (progressRatio >= 0.995 && !endHandledRef.current) {
          endHandledRef.current = true;
          setIsPaused(true);
          onEnd();
        }
      }

      const videoSize = player.videoTrack?.size ?? player.availableVideoTracks[0]?.size;
      if (videoSize) {
        onOrientationChange(getMediaOrientation(videoSize.width, videoSize.height));
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [onEnd, onOrientationChange, onProgress, player]);

  const togglePlayback = React.useCallback(() => {
    if (isPaused) {
      if (duration > 0 && currentTime >= duration - 0.1) {
        endHandledRef.current = false;
        player.currentTime = 0;
        setCurrentTime(0);
      }
      player.play();
      setIsPaused(false);
      return;
    }

    player.pause();
    setIsPaused(true);
  }, [currentTime, duration, isPaused, player]);

  const toggleMute = React.useCallback(() => {
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isMuted, player]);

  const handleSeek = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!duration || seekBarWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekBarWidth));
      const nextTime = duration * ratio;
      player.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, player, seekBarWidth]
  );
  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  return (
    <Animated.View
      style={[styles.mediaContainer, { bottom: mediaBottomOffset, top: mediaTopOffset }]}
      onLayout={onLayout}
    >
      <ZoomableMedia
        resetKey={mediaItem.url}
        onZoomActiveChange={onZoomActiveChange}
        onZoomedChange={onZoomedChange}
        overlay={
          <Pressable
            className="absolute inset-0"
            onPress={(event) => onPress(event, togglePlayback)}
            onLongPress={onStoryLongPress}
            onPressOut={onStoryPressOut}
            delayLongPress={180}
          >
            {isPaused ? (
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-black/40">
                  <PlayIcon size={25} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            ) : null}
          </Pressable>
        }
      >
        <VideoView
          player={player}
          nativeControls={false}
          contentFit={isContentSheetOpen ? 'contain' : 'cover'}
          playsInline
          surfaceType="textureView"
          style={styles.videoView}
        />
      </ZoomableMedia>

      {!isContentSheetOpen ? (
        <Pressable
          onPress={toggleMute}
          className="absolute right-5 z-30 h-8 w-8 items-center justify-center"
          style={{ bottom: muteBottomOffset }}
          hitSlop={8}
        >
          {isMuted ? (
            <VolumeXIcon size={26} color="#FFFFFF" />
          ) : (
            <Volume2Icon size={26} color="#FFFFFF" />
          )}
        </Pressable>
      ) : null}

      {!isContentSheetOpen ? (
        <VideoSeekBar
          progressRatio={progressRatio}
          onLayout={(event) => setSeekBarWidth(event.nativeEvent.layout.width)}
          onSeek={handleSeek}
        />
      ) : null}
    </Animated.View>
  );
}

function WebVideoMediaPlayer({
  mediaItem,
  isContentSheetOpen,
  isStoryPaused,
  mediaTopOffset,
  mediaBottomOffset,
  muteBottomOffset,
  onOrientationChange,
  onProgress,
  onEnd,
  onPress,
  onStoryLongPress,
  onStoryPressOut,
  onZoomActiveChange,
  onZoomedChange,
  onLayout,
}: VideoMediaPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [seekBarWidth, setSeekBarWidth] = React.useState(0);
  const endHandledRef = React.useRef(false);
  const wasPlayingBeforeStoryPauseRef = React.useRef(false);

  React.useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    endHandledRef.current = false;
    videoElement.load();
    videoElement
      .play()
      .then(() => setIsPaused(false))
      .catch(() => setIsPaused(true));
  }, [mediaItem.url]);

  const togglePlayback = React.useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement
        .play()
        .then(() => setIsPaused(false))
        .catch(() => setIsPaused(true));
      return;
    }

    videoElement.pause();
    setIsPaused(true);
  }, []);

  React.useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isStoryPaused) {
      wasPlayingBeforeStoryPauseRef.current = !videoElement.paused;
      videoElement.pause();
      return;
    }

    if (wasPlayingBeforeStoryPauseRef.current) {
      wasPlayingBeforeStoryPauseRef.current = false;
      videoElement
        .play()
        .then(() => setIsPaused(false))
        .catch(() => setIsPaused(true));
    }
  }, [isStoryPaused]);

  const toggleMute = React.useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const nextMuted = !isMuted;
    videoElement.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleSeek = React.useCallback(
    (event: GestureResponderEvent) => {
      const videoElement = videoRef.current;
      if (!videoElement || !duration || seekBarWidth <= 0) return;

      const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / seekBarWidth));
      const nextTime = duration * ratio;
      videoElement.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, seekBarWidth]
  );

  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  return (
    <Animated.View
      style={[styles.mediaContainer, { bottom: mediaBottomOffset, top: mediaTopOffset }]}
      onLayout={onLayout}
    >
      <ZoomableMedia
        resetKey={mediaItem.url}
        onZoomActiveChange={onZoomActiveChange}
        onZoomedChange={onZoomedChange}
        overlay={
          <Pressable
            className="absolute inset-0"
            onPress={(event) => onPress(event, togglePlayback)}
            onLongPress={onStoryLongPress}
            onPressOut={onStoryPressOut}
            delayLongPress={180}
          >
            {isPaused ? (
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-black/40">
                  <PlayIcon size={25} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            ) : null}
          </Pressable>
        }
      >
        {React.createElement('video', {
          ref: videoRef,
          src: mediaItem.url,
          autoPlay: true,
          loop: false,
          muted: isMuted,
          playsInline: true,
          controls: false,
          onLoadedMetadata: (event: React.SyntheticEvent<HTMLVideoElement>) => {
            const videoElement = event.currentTarget;
            setDuration(Number.isFinite(videoElement.duration) ? videoElement.duration : 0);
            onOrientationChange(
              getMediaOrientation(videoElement.videoWidth, videoElement.videoHeight)
            );
          },
          onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => {
            const videoElement = event.currentTarget;
            setCurrentTime(videoElement.currentTime);
            setDuration(Number.isFinite(videoElement.duration) ? videoElement.duration : 0);
            setIsPaused(videoElement.paused);
            if (Number.isFinite(videoElement.duration) && videoElement.duration > 0) {
              onProgress(
                Math.max(0, Math.min(1, videoElement.currentTime / videoElement.duration))
              );
            }
          },
          onEnded: () => {
            if (endHandledRef.current) return;
            endHandledRef.current = true;
            setIsPaused(true);
            onEnd();
          },
          style: {
            backgroundColor: '#000000',
            display: 'block',
            height: '100%',
            objectFit: 'contain',
            width: '100%',
          },
        })}
      </ZoomableMedia>

      {!isContentSheetOpen ? (
        <Pressable
          onPress={toggleMute}
          className="absolute right-5 z-30 h-8 w-8 items-center justify-center"
          style={{ bottom: muteBottomOffset }}
          hitSlop={8}
        >
          {isMuted ? (
            <VolumeXIcon size={26} color="#FFFFFF" />
          ) : (
            <Volume2Icon size={26} color="#FFFFFF" />
          )}
        </Pressable>
      ) : null}

      {!isContentSheetOpen ? (
        <VideoSeekBar
          progressRatio={progressRatio}
          onLayout={(event) => setSeekBarWidth(event.nativeEvent.layout.width)}
          onSeek={handleSeek}
        />
      ) : null}
    </Animated.View>
  );
}

function VideoSeekBar({
  progressRatio,
  onLayout,
  onSeek,
}: {
  progressRatio: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onSeek: (event: GestureResponderEvent) => void;
}) {
  return (
    // 영상 재생 위치 표시 및 이동
    <View style={styles.seekBarContainer}>
      <View
        className="h-[2px] justify-center bg-white/45"
        onLayout={onLayout}
        onTouchStart={onSeek}
        onTouchMove={onSeek}
      >
        <View className="h-full bg-blue-10" style={{ width: `${progressRatio * 100}%` }} />
      </View>
    </View>
  );
}

function getMediaOrientation(width: number, height: number): MediaOrientation {
  if (!width || !height) return 'unknown';
  return width > height ? 'landscape' : 'portrait';
}

const styles = StyleSheet.create({
  mediaContainer: {
    zIndex: 12,
    elevation: 12,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  seekBarContainer: {
    bottom: 0,
    elevation: 40,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 40,
  },
  videoView: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
});
