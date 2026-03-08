'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Track } from '@prisma/client';
import TrackCard from './TrackCard';

interface SortableTrackProps {
  track: Track;
}

export function SortableTrack({ track }: SortableTrackProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Translate.toString(transform), // Ändrade från Transform till Translate för mjukare flytt
    transition,
    opacity: isDragging ? 0.3 : 1, // Sänkte opacity lite mer vid drag
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none outline-none ${isDragging ? 'z-50' : 'z-0'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing'
      >
        <TrackCard
          key={track.id}
          id={track.id}
          title={track.title}
          bpm={track.bpm ?? undefined}
          keySig={track.key ?? undefined}
          audioUrl={track.audioUrl}
        />
      </div>
    </div>
  );
}
