'use client';
import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AudioTrack, useAudio } from '@/context/AudioContext';
import TrackCard from './TrackCard';

function mapToAudioTrack(track: AudioTrack): AudioTrack {
  return track;
}

interface SortableTrackProps {
  track: AudioTrack;
  allTracksInColumn: AudioTrack[];
}

export function SortableTrack({
  track,
  allTracksInColumn,
}: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: track.id });

  const {
    currentTrack,
    togglePlay,
    playTrack,
    setPlaylist,
    setSelectedTrackId,
  } = useAudio();

  const divRef = useRef<HTMLDivElement>(null);

  const audioTrack = mapToAudioTrack(track);
  const audioColumn = allTracksInColumn.map(mapToAudioTrack);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'none', // Ingen transition under aktiv drag
    opacity: isDragging ? 0 : 1, // Helt osynlig – bara en tom plats kvar
  };

  /*   const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation(); // Stoppar dnd-kit från att fånga space

      const isActive = currentTrack?.id === track.id;
      if (isActive) {
        togglePlay();
      } else if (track.audioUrl) {
        const playableTracks = allTracksInColumn
          .filter((t) => t.audioUrl)
          .map((t) => ({
            id: t.id,
            title: t.title,
            bpm: t.bpm,
            key: t.key,
            audioUrl: t.audioUrl,
          }));
        setPlaylist(playableTracks);
        playTrack({
          id: track.id,
          title: track.title,
          bpm: track.bpm,
          key: track.key,
          audioUrl: track.audioUrl,
        });
      }
    }
  }; */

  const { onKeyDown: dndKeyDown, ...restListeners } = listeners ?? {};

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (divRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }}
      style={style}
      className={`touch-none outline-none focus:outline-none ${isDragging ? 'z-50 relative' : ''}`}
      onClick={() => {
        setSelectedTrackId(track.id);
        divRef.current?.focus();
      }}
      {...attributes}
      {...restListeners}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const isActive = currentTrack?.id === track.id;
          if (isActive) {
            togglePlay();
          } else if (track.audioUrl) {
            const playableTracks = allTracksInColumn
              .filter((t) => t.audioUrl)
              .map((t) => ({
                id: t.id,
                title: t.title,
                bpm: t.bpm,
                key: t.key,
                audioUrl: t.audioUrl,
              }));
            setPlaylist(playableTracks);
            playTrack({
              id: track.id,
              title: track.title,
              bpm: track.bpm,
              key: track.key,
              audioUrl: track.audioUrl,
            });
          }
          return;
        }
        dndKeyDown?.(e);
      }}
    >
      <div className='cursor-grab active:cursor-grabbing'>
        <TrackCard
          id={audioTrack.id}
          title={audioTrack.title}
          bpm={audioTrack.bpm}
          keySig={audioTrack.key}
          audioUrl={audioTrack.audioUrl}
          allTracksInColumn={audioColumn}
        />
      </div>
    </div>
  );
}
