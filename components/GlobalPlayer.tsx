'use client';

import { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function GlobalPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    playNext,
    playPrevious,
    playlist,
  } = useAudio();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hitta nästa låt i listan
  const currentIndex = playlist.findIndex((t) => t.id === currentTrack?.id);
  const nextTrack = playlist[currentIndex + 1];
  const nextTrackName = nextTrack?.title; // Blir undefined om det är sista låten

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vi kollar så att användaren inte skriver i ett input-fält (t.ex. döper om en låt)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(progress + 5, duration));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(progress - 5, 0));
      }
      if (e.key === ' ') {
        // Space för Play/Pause är också nice!
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress, duration, seek, togglePlay]);

  if (!currentTrack) return null;

  // Om ingen låt är vald, dölj spelaren helt
  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-white/5 z-100 transition-transform duration-300 ease-in-out ${
        isCollapsed ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Kontrollknapp för att fälla upp/ner */}
      <div className='absolute -top-8 right-8'>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='bg-zinc-950/90 border border-white/5 border-b-0 py-2 px-3 rounded-t-lg text-zinc-400 hover:text-accent transition-colors flex items-center gap-2 text-[10px] uppercase font-black tracking-widest'
        >
          {/* Pulserande playknapp om musik spelas */}
          {isPlaying && isCollapsed && (
            <div className='relative flex items-center justify-center w-5 h-5'>
              {/* Den pulserande effekten bakom */}
              <Play
                size={14}
                fill='currentColor'
                className='absolute animate-ping text-accent opacity-35'
              />
              {/* Den fasta ikonen framför */}
              <Play
                size={14}
                fill='currentColor'
                className='relative text-accent'
              />
            </div>
          )}

          {isCollapsed ? (
            <>
              <ChevronUp size={14} /> Show Player
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Hide
            </>
          )}
        </button>
      </div>
      <div className='max-w-7xl mx-auto flex items-center justify-between gap-8 p-4'>
        {/* Vänster: Info */}
        <div className='w-1/4'>
          {/* Subtil indikator för nästa låt */}
          {nextTrackName && (
            <span className='text-[9px] text-zinc-600 opacity-70 uppercase tracking-widest truncate max-w-25 '>
              Next: {nextTrackName}
            </span>
          )}

          <p className='text-s text-accent font-black uppercase tracking-tighter truncate'>
            {currentTrack.title}
          </p>

          <div className='flex items-center gap-3 mt-1'>
            <div className='flex gap-2'>
              {currentTrack.bpm && (
                <span className='text-[9px] text-zinc-500 font-mono'>
                  {currentTrack.bpm} BPM
                </span>
              )}
              {currentTrack.key && (
                <span className='text-[9px] text-zinc-500 font-mono border-l border-white/10 pl-2'>
                  Key: {currentTrack.key}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mitten: Kontroller & Progress */}
        <div className='flex-1 flex flex-col items-center gap-2'>
          <div className='flex items-center gap-6'>
            {/* SKIP BACK -> playPrevious */}
            <button
              onClick={playPrevious}
              className='text-zinc-600 hover:text-white transition-colors p-2'
              title='Previous / Reset'
            >
              <SkipBack size={18} fill='currentColor' />
            </button>

            {/* PLAY / PAUSE */}
            <button
              onClick={togglePlay}
              className='text-accent hover:text-white transition-colors p-2'
              title='Play / Pause'
            >
              {isPlaying ? (
                <Pause size={24} fill='currentColor' />
              ) : (
                <Play size={24} fill='currentColor' />
              )}
            </button>

            {/* SKIP FORWARD -> playNext */}
            <button
              onClick={playNext}
              className='text-zinc-600 hover:text-white transition-colors p-2'
              title='Next Track'
            >
              <SkipForward size={18} fill='currentColor' />
            </button>
          </div>

          <div className='w-full flex items-center gap-3'>
            <span className='text-[10px] text-zinc-500 font-mono w-10 text-right'>
              {formatTime(progress)}
            </span>
            <input
              type='range'
              min={0}
              max={duration || 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className='flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer'
              style={{
                // Vi räknar ut hur många procent av låten som har spelats
                background: `linear-gradient(to right, #ff5722 0%, #ff5722 ${
                  duration ? (progress / duration) * 100 : 0
                }%, #27272a ${
                  duration ? (progress / duration) * 100 : 0
                }%, #27272a 100%)`,
              }}
            />
            <span className='text-[10px] text-zinc-500 font-mono w-10'>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Höger: VolymReglage */}
        <div className='w-1/4 flex justify-end items-center gap-3 group'>
          <div className='flex items-center gap-2 bg-zinc-900/50 px-3 py-2 rounded-full border border-white/5 transition-colors group-hover:border-white/10'>
            {/* Här kollar vi om volymen är 0 */}
            <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)}>
              {volume === 0 ? (
                <VolumeX size={16} className='text-zinc-600' />
              ) : (
                <Volume2 size={16} className='text-accent' />
              )}
            </button>

            <input
              type='range'
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className='w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-hoveraccent'
              style={{
                background: `linear-gradient(to right, #ff5722 0%, #ff5722 ${
                  volume * 100
                }%, #27272a ${volume * 100}%, #27272a 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
