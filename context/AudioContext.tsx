'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Track } from '@prisma/client'; // Fixar "Cannot find name 'Track'"

// AudioContext only needs a handful of fields from the Prisma
// Track type, and in the UI we frequently work with partial data
// (e.g. BPM may be undefined).  Rather than forcing every caller
// to construct a full Prisma Track object with explicit nulls we
// define a lighter `AudioTrack` type with optional fields.
export type AudioTrack = Pick<Track, 'id' | 'title'> & {
  bpm?: number | null;
  key?: string | null;
  audioUrl?: string | null;
  track?: string | null;
};

export const mapToAudioTrack = (track: Track): AudioTrack => ({
  id: track.id,
  title: track.title,
  bpm: track.bpm,
  key: track.key,
  audioUrl: track.audioUrl,
});

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  activeTrackId: string | null;
  playTrack: (track: AudioTrack) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  volume: number;
  setVolume: (value: number) => void;
  playlist: AudioTrack[];
  setPlaylist: (tracks: AudioTrack[]) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Själva ljudmotorn som lever under hela sessionen
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Skapa audio-elementet en gång vid mount
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setProgress(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playTrack = useCallback(
    (track: AudioTrack) => {
      if (!audioRef.current) return;

      if (currentTrack?.id !== track.id) {
        setCurrentTrack(track);
        setActiveTrackId(track.id);
        audioRef.current.src = track.audioUrl || '';
        audioRef.current.load();
      }

      audioRef.current.play();
      setIsPlaying(true);
      navigator.mediaSession.playbackState = 'playing';
    },
    [currentTrack?.id],
  ); // Beror bara på om ID:t ändras

  const pauseTrack = () => {
    // I pauseTrack
    audioRef.current?.pause();
    setIsPlaying(false);
    navigator.mediaSession.playbackState = 'paused';
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const seek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        const newTime = Math.max(0, Math.min(time, duration));
        audioRef.current.currentTime = newTime;
        setProgress(newTime);
      }
    },
    [duration],
  );

  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);

  // 3. PLAY NEXT - Logiken
  const playNext = useCallback(() => {
    if (!currentTrack || !audioRef.current) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextTrack = playlist[currentIndex + 1];

    if (nextTrack) {
      playTrack(nextTrack);
    } else {
      seek(audioRef.current.currentTime + 30);
    }
  }, [currentTrack, playlist, playTrack, seek]);

  // 4. PLAY PREVIOUS - Logiken
  const playPrevious = useCallback(() => {
    if (!currentTrack || !audioRef.current) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const currentTime = audioRef.current.currentTime;

    if (currentTime > 2 || currentIndex <= 0) {
      seek(0);
    } else {
      const prevTrack = playlist[currentIndex - 1];
      if (prevTrack) {
        playTrack(prevTrack);
      }
    }
  }, [currentTrack, playlist, playTrack, seek]);

  // Kontroll för media-knapparna på tangentbordet (⏮ ⏯ ⏭)
  useEffect(() => {
    if (!currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.bpm ? `${currentTrack.bpm} BPM` : undefined,
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
      navigator.mediaSession.playbackState = 'playing';
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      navigator.mediaSession.playbackState = 'paused';
    });
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
  }, [currentTrack, playNext, playPrevious]); // Ta bort duration och progress härifrån

  // Separat effect för position – kör ofta men kraschar inte handlers
  useEffect(() => {
    if (!duration || !isFinite(duration) || duration <= 0) return;
    const safeProgress = Math.min(progress, duration);

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: safeProgress,
      });
    } catch {
      // Ignorera – kan ske vid låtbyte
    }
  }, [progress, duration]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        activeTrackId,
        playTrack,
        pauseTrack,
        togglePlay,
        progress,
        duration,
        seek,
        volume,
        setVolume,
        playlist,
        setPlaylist,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
