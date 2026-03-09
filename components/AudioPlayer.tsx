'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

interface AudioPlayerProps {
  src: string;
  trackId: string;
}

export default function AudioPlayer({ src, trackId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeTrackId, setActiveTrackId } = useAudio();

  // 1. Dirigent-logik: Pausa BARA ljudet här.
  // Vi rör inte setIsPlaying här, vilket tar bort varningen.
  useEffect(() => {
    if (
      activeTrackId !== trackId &&
      audioRef.current &&
      !audioRef.current.paused
    ) {
      audioRef.current.pause();
    }
  }, [activeTrackId, trackId]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      setActiveTrackId(trackId);
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  // Volymkontroll-funktion
  const handleVolumeChange = (value: string) => {
    const newVolume = parseFloat(value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100 || 0,
      );
    }
  };

  const handleScrub = (value: string) => {
    const time = (parseFloat(value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(parseFloat(value));
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!src || src.trim() === '') return null;

  return (
    <div className='flex flex-col gap-2 w-full bg-black/20 p-3 rounded-lg border border-white/5'>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() =>
          audioRef.current && setDuration(audioRef.current.duration)
        }
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setActiveTrackId(null);
        }}
      />

      <div className='flex items-center gap-3'>
        <button
          onClick={togglePlay}
          className='w-8 h-8 flex items-center justify-center rounded-full bg-accent text-black hover:scale-105 transition-all shrink-0'
        >
          {isPlaying ? (
            <Pause size={14} fill='currentColor' />
          ) : (
            <Play size={14} className='ml-0.5' fill='currentColor' />
          )}
        </button>

        <div className='flex-1 flex flex-col gap-1'>
          <input
            type='range'
            value={progress}
            onChange={(e) => handleScrub(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className='w-full h-1 bg-zinc-700 appearance-none rounded-full accent-accent cursor-pointer'
          />
          <div className='flex justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-tighter'>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-2 self-end w-24 opacity-60 hover:opacity-100 transition-opacity'>
        {volume === 0 ? (
          <VolumeX size={12} className='text-zinc-500' />
        ) : (
          <Volume2 size={12} className='text-zinc-500' />
        )}
        <input
          type='range'
          min='0'
          max='100'
          value={volume * 100}
          onChange={(e) => handleVolumeChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className='w-full h-1 bg-zinc-800 appearance-none rounded-full accent-zinc-400 cursor-pointer'
        />
      </div>
    </div>
  );
}
