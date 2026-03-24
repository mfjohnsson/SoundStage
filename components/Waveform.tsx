'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
  audioUrl: string;
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
}

export default function Waveform({
  audioUrl,
  progress,
  duration,
  onSeek,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isReadyRef = useRef(false);
  const isSeeking = useRef(false);

  const onSeekRef = useRef(onSeek);
  useEffect(() => {
    onSeekRef.current = onSeek;
  }, [onSeek]);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current?.destroy();
    isReadyRef.current = false;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#3f3f46',
      progressColor: '#ff5722',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      normalize: true,
      url: audioUrl, // Använd url istället för load()
    });

    ws.on('ready', () => {
      isReadyRef.current = true;
    });

    ws.on('interaction', (newTime: number) => {
      isSeeking.current = true;
      onSeekRef.current(newTime);
      setTimeout(() => {
        isSeeking.current = false;
      }, 200);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  // Synka progress → WaveSurfer
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReadyRef.current || isSeeking.current || duration === 0)
      return;

    const ratio = progress / duration;
    const clamped = Math.max(0, Math.min(ratio, 1));
    ws.seekTo(clamped);
  }, [progress, duration]);

  return (
    <div className='relative w-full'>
      <div ref={containerRef} className='w-full cursor-pointer' />
    </div>
  );
}
