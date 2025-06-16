'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  RotateCcw,
  Settings,
} from 'lucide-react';
import type { FilePreviewData, BaseComponentProps } from '@/types';
import { useTranslations } from 'next-intl';
import { useKeyboardLayoutDetection } from '@/lib/ui/keyboard';
import { KeyboardShortcutsButton } from './KeyboardShortcutsModal';

interface VideoPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  const t = useTranslations('FilePreview');
  const keyboardLayout = useKeyboardLayoutDetection();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Format time helper
  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Smooth time update using requestAnimationFrame
  const updateTime = useCallback(() => {
    if (videoRef.current && isPlaying && !isDragging) {
      setCurrentTime(videoRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, isDragging]);

  // Start/stop smooth time updates
  useEffect(() => {
    if (isPlaying && !isDragging) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isDragging, updateTime]);

  // Play/Pause toggle
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Volume control
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Seek functions
  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  }, [currentTime]);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  }, [currentTime, duration]);

  // Reset video
  const resetVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, []);

  // Progress change with drag handling
  const handleProgressChange = useCallback((value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newTime = value[0];
      setCurrentTime(newTime);
    }
  }, []);

  const handleProgressChangeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressChangeEnd = useCallback((value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    setIsDragging(false);
  }, []);

  // Volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current && value.length > 0) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  // Playback rate change
  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    // Only update time if we're not using smooth animation (for seeking events)
    if (videoRef.current && (!isPlaying || isDragging)) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [isPlaying, isDragging]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts with improved detection
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!videoRef.current || showSettings) return;

      // Ignore key events when user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Debug logging to help troubleshoot (console only)
      console.debug('Key pressed:', {
        key: event.key,
        code: event.code,
        layout: keyboardLayout.layout,
        confidence: keyboardLayout.confidence,
      });

      let handled = false;

      // Space or K for play/pause (universal)
      if (event.key === ' ' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePlayPause();
        handled = true;
      }
      // Mute - handle both direct key and layout-specific
      else if (
        event.key.toLowerCase() === 'm' ||
        (keyboardLayout.layout === 'azerty' &&
          (event.key === ',' || event.key === '?'))
      ) {
        event.preventDefault();
        toggleMute();
        handled = true;
      }
      // Fullscreen
      else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
        handled = true;
      }
      // Volume controls (arrow keys are universal)
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (videoRef.current) {
          const newVolume = Math.min(1, volume + 0.1);
          handleVolumeChange([newVolume]);
        }
        handled = true;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (videoRef.current) {
          const newVolume = Math.max(0, volume - 0.1);
          handleVolumeChange([newVolume]);
        }
        handled = true;
      }
      // Seek forward
      else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'l') {
        event.preventDefault();
        skipForward();
        handled = true;
      }
      // Seek backward
      else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'j') {
        event.preventDefault();
        skipBackward();
        handled = true;
      }
      // Reset
      else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetVideo();
        handled = true;
      }
      // Number keys for seeking to percentage
      else if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const percentage = parseInt(event.key) * 10;
        if (videoRef.current && duration) {
          videoRef.current.currentTime = (percentage / 100) * duration;
        }
        handled = true;
      }
      // Speed controls
      else if (event.key === '>' || event.key === '.') {
        event.preventDefault();
        const newRate = Math.min(2, playbackRate + 0.25);
        handlePlaybackRateChange(newRate);
        handled = true;
      } else if (event.key === '<' || event.key === ',') {
        event.preventDefault();
        const newRate = Math.max(0.25, playbackRate - 0.25);
        handlePlaybackRateChange(newRate);
        handled = true;
      }

      if (handled) {
        console.debug('Keyboard shortcut handled successfully');
      }
    };

    // Use capture phase for better event handling
    document.addEventListener('keydown', handleKeyPress, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener('keydown', handleKeyPress, {
        capture: true,
      });
    };
  }, [
    keyboardLayout.layout,
    keyboardLayout.confidence,
    showSettings,
    volume,
    duration,
    playbackRate,
    togglePlayPause,
    skipBackward,
    skipForward,
    toggleMute,
    toggleFullscreen,
    resetVideo,
    handleVolumeChange,
    handlePlaybackRateChange,
  ]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      if (isPlaying && !showSettings && !isDragging) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    if (isPlaying && !isDragging) {
      resetTimeout();
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, showSettings, isDragging]);

  // Touch/click handlers for mobile responsiveness
  const handleVideoClick = useCallback(() => {
    if (!showControls) {
      setShowControls(true);
    } else {
      togglePlayPause();
    }
  }, [showControls, togglePlayPause]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg bg-black shadow-lg ${
        isFullscreen ? 'fixed inset-0 z-50' : 'max-w-full'
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && !showSettings && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={file.url}
        className={`w-full ${isFullscreen ? 'h-screen' : 'max-h-[500px]'} cursor-pointer object-contain`}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onClick={handleVideoClick}
      >
        {t('videoNotSupported')}
      </video>

      {/* Loading Spinner */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        </motion.div>
      )}

      {/* Custom Controls */}
      <motion.div
        className={`absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/90 to-transparent p-4 ${
          showControls ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        initial={{ y: 20 }}
        animate={{ y: showControls ? 0 : 20 }}
      >
        {/* Progress Bar */}
        <div className="relative mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleProgressChange}
            onValueCommit={handleProgressChangeEnd}
            onPointerDown={handleProgressChangeStart}
            className="w-full cursor-pointer"
          />
          <div className="mt-1 flex justify-between text-xs text-white/80">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          {/* Time preview while dragging */}
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 transform rounded bg-black/90 px-2 py-1 text-xs text-white"
            >
              {formatTime(currentTime)}
            </motion.div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="text-white hover:bg-white/20"
              title="Reculer 10s (←)"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
              title="Play/Pause (Espace)"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="text-white hover:bg-white/20"
              title="Avancer 10s (→)"
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetVideo}
              className="text-white hover:bg-white/20"
              title="Restart (R)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
                title="Muet/Son (M)"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>

              {showSettings && (
                <motion.div
                  className="absolute right-0 bottom-full mb-2 min-w-[150px] rounded-lg bg-black/90 p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="mb-2 text-sm text-white">
                    Vitesse de lecture
                  </div>
                  <div className="space-y-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-white/20 ${
                          playbackRate === rate
                            ? 'bg-white/30 text-white'
                            : 'text-white/80'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsButton />

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading/Play overlay */}
      {!isPlaying && !isLoading && (
        <motion.div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={togglePlayPause}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full p-6 text-white hover:bg-white/20"
            >
              <Play className="h-12 w-12" />
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Keyboard shortcuts hint */}
      {showControls && (
        <motion.div
          className="absolute top-4 right-4 max-w-[200px] rounded-lg bg-black/50 px-3 py-2 text-xs text-white/60"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="space-y-1">
            <div>
              <strong>Espace:</strong> Play/Pause
            </div>
            <div>
              <strong>← →:</strong> ±10s
            </div>
            <div>
              <strong>↑ ↓:</strong> Volume
            </div>
            <div>
              <strong>M:</strong> Muet
            </div>{' '}
            <div>
              <strong>F:</strong> Fullscreen
            </div>
            <div>
              <strong>R:</strong> Restart
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
