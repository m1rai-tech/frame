import Hls from 'hls.js';
import {
  Captions,
  Expand,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { PlaybackSnapshot } from '@/features/player/watch-progress.service';
import type { PlaybackVariant } from '@/features/player/playback.service';

type PlayerState = 'loading' | 'ready' | 'error' | 'unsupported';
type QualityLevel = { index: number; label: string };
type TrackOption = { index: number; label: string };

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remainder = whole % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
};

export function HlsVideo({
  intro,
  initialPositionSeconds = 0,
  activeAssetId,
  onNext,
  onProgress,
  onVariantChange,
  outroStart,
  poster,
  source,
  variants = [],
}: {
  activeAssetId?: string;
  initialPositionSeconds?: number;
  intro?: { start: number; end: number };
  onNext?: () => void;
  onProgress?: (snapshot: PlaybackSnapshot) => void;
  onVariantChange?: (assetId: string) => void;
  outroStart?: number;
  poster?: string;
  source: string;
  variants?: PlaybackVariant[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const resumeTimeRef = useRef(Math.max(0, initialPositionSeconds));
  const [state, setState] = useState<PlayerState>('loading');
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [quality, setQuality] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<TrackOption[]>([]);
  const [audioTrack, setAudioTrack] = useState(0);
  const [subtitleTracks, setSubtitleTracks] = useState<TrackOption[]>([]);
  const [subtitleTrack, setSubtitleTrack] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onReady = () => {
      if (resumeTimeRef.current > 0 && resumeTimeRef.current < video.duration) {
        video.currentTime = resumeTimeRef.current;
      }
      setState('ready');
      setDuration(video.duration || 0);
      onProgress?.({
        positionSeconds: video.currentTime,
        durationSeconds: video.duration || 0,
        isPlaying: !video.paused,
      });
    };
    const onNativeError = () => setState('error');
    const onTime = () => {
      resumeTimeRef.current = video.currentTime;
      setCurrentTime(video.currentTime);
      onProgress?.({
        positionSeconds: video.currentTime,
        durationSeconds: video.duration || 0,
        isPlaying: !video.paused,
      });
    };
    const onDuration = () => setDuration(video.duration || 0);
    const onPlay = () => setPaused(false);
    const onPause = () => {
      setPaused(true);
      onProgress?.({
        positionSeconds: video.currentTime,
        durationSeconds: video.duration || 0,
        isPlaying: false,
      });
    };
    const onEnded = () => {
      onProgress?.({
        positionSeconds: video.currentTime,
        durationSeconds: video.duration || 0,
        isPlaying: false,
        ended: true,
      });
    };
    const onVolume = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const onRate = () => setPlaybackRate(video.playbackRate);
    const onEnterPip = () => setIsPictureInPicture(true);
    const onLeavePip = () => setIsPictureInPicture(false);
    const onBuffering = () => setState('loading');
    const onPlaying = () => setState('ready');
    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('ratechange', onRate);
    video.addEventListener('enterpictureinpicture', onEnterPip);
    video.addEventListener('leavepictureinpicture', onLeavePip);
    video.addEventListener('waiting', onBuffering);
    video.addEventListener('stalled', onBuffering);
    video.addEventListener('playing', onPlaying);

    const clearListeners = () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('ratechange', onRate);
      video.removeEventListener('enterpictureinpicture', onEnterPip);
      video.removeEventListener('leavepictureinpicture', onLeavePip);
      video.removeEventListener('waiting', onBuffering);
      video.removeEventListener('stalled', onBuffering);
      video.removeEventListener('playing', onPlaying);
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('error', onNativeError, { once: true });
      return () => {
        clearListeners();
        video.removeEventListener('error', onNativeError);
        video.removeAttribute('src');
        video.load();
      };
    }
    if (!Hls.isSupported()) {
      const unsupportedTimer = window.setTimeout(() => setState('unsupported'), 0);
      return () => {
        window.clearTimeout(unsupportedTimer);
        clearListeners();
      };
    }

    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    let networkRetries = 0;
    const retryTimers: number[] = [];
    hlsRef.current = hls;
    hls.loadSource(source);
    hls.attachMedia(video);
    const syncTracks = () => {
      setQualities(
        hls.levels.map((level, index) => ({
          index,
          label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps`,
        })),
      );
      setAudioTracks(
        hls.audioTracks.map((track, index) => ({
          index,
          label: track.name || track.lang || `Доріжка ${index + 1}`,
        })),
      );
      setSubtitleTracks(
        hls.subtitleTracks.map((track, index) => ({
          index,
          label: track.name || track.lang || `Субтитри ${index + 1}`,
        })),
      );
    };
    hls.on(Hls.Events.MANIFEST_PARSED, syncTracks);
    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, syncTracks);
    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, syncTracks);
    hls.on(Hls.Events.FRAG_LOADED, () => {
      networkRetries = 0;
      setState('ready');
    });
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 3) {
        networkRetries += 1;
        setState('loading');
        retryTimers.push(
          window.setTimeout(() => hls.startLoad(), Math.min(8000, 1000 * 2 ** networkRetries)),
        );
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      else {
        setState('error');
        hls.destroy();
      }
    });
    return () => {
      clearListeners();
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      hls.destroy();
      hlsRef.current = null;
    };
  }, [attempt, onProgress, source]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }, []);
  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (video)
      video.currentTime = Math.min(
        video.duration || Infinity,
        Math.max(0, video.currentTime + seconds),
      );
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (containerRef.current?.requestFullscreen) void containerRef.current.requestFullscreen();
  }, []);
  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else void video.requestPictureInPicture();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)
      return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'k') {
      event.preventDefault();
      togglePlayback();
    } else if (key === 'arrowleft') seekBy(-10);
    else if (key === 'arrowright') seekBy(10);
    else if (key === 'm' && videoRef.current) videoRef.current.muted = !videoRef.current.muted;
    else if (key === 'f') toggleFullscreen();
    else if (key === 'p') togglePictureInPicture();
  };

  return (
    <div
      aria-label="Відеоплеєр"
      className="group relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl"
      onDoubleClick={toggleFullscreen}
      onKeyDown={onKeyDown}
      ref={containerRef}
      role="region"
      tabIndex={0}
    >
      <video
        aria-label="HLS demo-плеєр"
        className="size-full"
        onEnded={onNext}
        onClick={togglePlayback}
        playsInline
        poster={poster}
        preload="metadata"
        ref={videoRef}
      />
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-sm text-white">
          Завантаження потоку…
        </div>
      )}
      {isOffline && (
        <div className="absolute inset-x-4 top-4 z-20 rounded-lg border border-amber-300/25 bg-black/85 px-4 py-3 text-center text-sm text-amber-100 backdrop-blur">
          Немає мережі. Відтворення продовжиться після відновлення з’єднання.
        </div>
      )}
      {state === 'ready' && paused && (
        <button
          aria-label="Відтворити"
          className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-xl transition-transform hover:scale-105"
          onClick={togglePlayback}
          type="button"
        >
          <Play className="ml-1 size-7" fill="currentColor" />
        </button>
      )}
      {state === 'ready' && intro && currentTime >= intro.start && currentTime < intro.end && (
        <Button
          className="absolute bottom-24 right-4 z-30 min-h-11 cursor-pointer border-white/25 bg-black/75 px-5 text-white backdrop-blur sm:bottom-28 sm:right-6"
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime = intro.end;
          }}
          variant="secondary"
        >
          Пропустити вступ
        </Button>
      )}
      {state === 'ready' && onNext && outroStart !== undefined && currentTime >= outroStart && (
        <Button
          className="absolute bottom-24 right-4 z-30 min-h-11 cursor-pointer border-white/25 bg-black/75 px-5 text-white backdrop-blur sm:bottom-28 sm:right-6"
          onClick={onNext}
          variant="secondary"
        >
          Наступний епізод
        </Button>
      )}
      {state === 'ready' && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-12 text-white sm:px-5 sm:pb-4">
          <label className="block" title="Позиція відтворення">
            <span className="sr-only">Позиція відтворення</span>
            <input
              aria-label="Позиція відтворення"
              className="h-1 w-full cursor-pointer accent-[#d18a34]"
              max={duration || 0}
              min="0"
              onChange={(event) => {
                if (videoRef.current)
                  videoRef.current.currentTime = Number(event.currentTarget.value);
              }}
              step="0.1"
              type="range"
              value={Math.min(currentTime, duration || 0)}
            />
          </label>
          <div className="mt-2 flex items-center gap-1 sm:gap-2">
            <Button
              aria-label={paused ? 'Відтворити' : 'Пауза'}
              onClick={togglePlayback}
              size="icon"
              variant="ghost"
            >
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </Button>
            <Button
              aria-label="Назад на 10 секунд"
              className="hidden sm:inline-flex"
              onClick={() => seekBy(-10)}
              size="icon"
              variant="ghost"
            >
              <RotateCcw className="size-5" />
            </Button>
            <Button
              aria-label="Вперед на 10 секунд"
              className="hidden sm:inline-flex"
              onClick={() => seekBy(10)}
              size="icon"
              variant="ghost"
            >
              <RotateCw className="size-5" />
            </Button>
            <Button
              aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
              onClick={() => {
                if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
              }}
              size="icon"
              variant="ghost"
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </Button>
            <input
              aria-label="Гучність"
              className="hidden w-20 accent-[#d18a34] sm:block"
              max="1"
              min="0"
              onChange={(event) => {
                if (videoRef.current) videoRef.current.volume = Number(event.currentTarget.value);
              }}
              step="0.05"
              type="range"
              value={volume}
            />
            <span className="ml-1 text-xs tabular-nums text-white/75 sm:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <div className="relative">
                <Button
                  aria-expanded={settingsOpen}
                  aria-label="Налаштування плеєра"
                  onClick={() => setSettingsOpen((value) => !value)}
                  size="icon"
                  variant="ghost"
                >
                  <Settings2 className="size-5" />
                </Button>
                {settingsOpen && (
                  <div className="absolute bottom-12 right-0 grid min-w-64 gap-4 rounded-lg border border-white/15 bg-black/95 p-4 text-sm shadow-2xl">
                    <label className="grid gap-1">
                      <span className="flex items-center gap-2 text-white/65">
                        <Gauge className="size-4" /> Швидкість
                      </span>
                      <select
                        className="h-9 rounded border border-white/15 bg-white/10 px-2"
                        onChange={(event) => {
                          if (videoRef.current)
                            videoRef.current.playbackRate = Number(event.currentTarget.value);
                        }}
                        value={playbackRate}
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}×
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="flex items-center gap-2 text-white/65">
                        <Expand className="size-4" /> Якість
                      </span>
                      <select
                        className="h-9 rounded border border-white/15 bg-white/10 px-2"
                        disabled={qualities.length === 0}
                        onChange={(event) => {
                          const next = Number(event.currentTarget.value);
                          setQuality(next);
                          if (hlsRef.current) hlsRef.current.currentLevel = next;
                        }}
                        value={quality}
                      >
                        <option value="-1">Auto</option>
                        {qualities.map((item) => (
                          <option key={item.index} value={item.index}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-white/65">Озвучка</span>
                      <select
                        className="h-9 rounded border border-white/15 bg-white/10 px-2"
                        disabled={variants.length < 2}
                        onChange={(event) => onVariantChange?.(event.currentTarget.value)}
                        value={activeAssetId ?? variants[0]?.assetId ?? ''}
                      >
                        {variants.map((variant) => (
                          <option key={variant.assetId} value={variant.assetId}>
                            {variant.audioLanguage === 'uk'
                              ? 'Українська'
                              : variant.audioLanguage === 'ru'
                                ? 'Російська'
                                : variant.audioLanguage === 'en'
                                  ? 'Англійська'
                                  : variant.audioLanguage}
                            {variant.versionLabel ? ` · ${variant.versionLabel}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-white/65">Аудіодоріжка</span>
                      <select
                        className="h-9 rounded border border-white/15 bg-white/10 px-2"
                        disabled={audioTracks.length < 2}
                        onChange={(event) => {
                          const next = Number(event.currentTarget.value);
                          setAudioTrack(next);
                          if (hlsRef.current) hlsRef.current.audioTrack = next;
                        }}
                        value={audioTrack}
                      >
                        {audioTracks.length === 0 && <option>Основна</option>}
                        {audioTracks.map((item) => (
                          <option key={item.index} value={item.index}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="flex items-center gap-2 text-white/65">
                        <Captions className="size-4" /> Субтитри
                      </span>
                      <select
                        className="h-9 rounded border border-white/15 bg-white/10 px-2"
                        onChange={(event) => {
                          const next = Number(event.currentTarget.value);
                          setSubtitleTrack(next);
                          if (hlsRef.current) hlsRef.current.subtitleTrack = next;
                        }}
                        value={subtitleTrack}
                      >
                        <option value="-1">Вимкнено</option>
                        {subtitleTracks.map((item) => (
                          <option key={item.index} value={item.index}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
              {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                <Button
                  aria-label={
                    isPictureInPicture ? 'Закрити Picture-in-Picture' : 'Picture-in-Picture'
                  }
                  className="hidden sm:inline-flex"
                  onClick={togglePictureInPicture}
                  size="icon"
                  variant="ghost"
                >
                  <PictureInPicture2 className="size-5" />
                </Button>
              )}
              <Button
                aria-label={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}
                onClick={toggleFullscreen}
                size="icon"
                variant="ghost"
              >
                {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
      {(state === 'error' || state === 'unsupported') && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center text-white">
          <div>
            <p className="font-semibold">
              {state === 'unsupported'
                ? 'Цей браузер не підтримує доступний спосіб HLS-відтворення.'
                : 'Не вдалося завантажити тестовий потік.'}
            </p>
            {state === 'error' && (
              <Button className="mt-5" onClick={() => setAttempt((value) => value + 1)}>
                Спробувати ще раз
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
