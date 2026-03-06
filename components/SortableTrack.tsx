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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='touch-none' // Viktigt för mobil/touch-enheter
    >
      <TrackCard
        title={track.title}
        bpm={track.bpm ?? undefined}
        keySig={track.key ?? undefined}
      />
    </div>
  );
}
