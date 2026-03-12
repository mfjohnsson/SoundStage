'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AudioTrack } from '@/context/AudioContext';
import TrackCard from './TrackCard';

function mapToAudioTrack(track: AudioTrack): AudioTrack {
  return track;
}

interface SortableTrackProps {
  track: AudioTrack; // Ändra från Track till AudioTrack
  allTracksInColumn: AudioTrack[]; // Ändra här också
}

export function SortableTrack({
  track,
  allTracksInColumn,
}: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: track.id });

  const audioTrack = mapToAudioTrack(track);
  const audioColumn = allTracksInColumn.map(mapToAudioTrack);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'none', // Ingen transition under aktiv drag
    opacity: isDragging ? 0 : 1, // Helt osynlig – bara en tom plats kvar
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none outline-none ${isDragging ? 'z-50 relative' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing'
      >
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
