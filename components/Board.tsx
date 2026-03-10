'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverEvent,
  DragEndEvent,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FullBoard } from '@/types';
import { SortableTrack } from './SortableTrack';
import AddTrack from './AddTrack';
import { updateTrackPosition, updateTracksOrder } from '@/actions/tracks';
// Importera helpern här
import { mapToAudioTrack } from '@/context/AudioContext';

export default function Board({ initialData }: { initialData: FullBoard }) {
  const [board, setBoard] = useState(initialData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBoard(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCollision: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCenter(args);
  };

  if (!mounted) return <div className='flex gap-8 h-full opacity-0' />;

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeList = board.lists.find((l) =>
      l.tracks.some((t) => t.id === activeId),
    );

    const overList =
      board.lists.find((l) => l.id === overId) ||
      board.lists.find((l) => l.tracks.some((t) => t.id === overId));

    if (!activeList || !overList || activeList.id === overList.id) return;

    setBoard((prev) => {
      const activeTrack = activeList.tracks.find((t) => t.id === activeId)!;
      const isOverATrack = overList.tracks.some((t) => t.id === overId);

      let newIndex = overList.tracks.length;
      if (isOverATrack) {
        newIndex = overList.tracks.findIndex((t) => t.id === overId);
      }

      return {
        ...prev,
        lists: prev.lists.map((list) => {
          if (list.id === activeList.id) {
            return {
              ...list,
              tracks: list.tracks.filter((t) => t.id !== activeId),
            };
          }
          if (list.id === overList.id) {
            const newTracks = [...list.tracks];
            newTracks.splice(newIndex, 0, {
              ...activeTrack,
              stageId: overList.id,
            });
            return { ...list, tracks: newTracks };
          }
          return list;
        }),
      };
    });

    await updateTrackPosition(activeId, overList.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const list = board.lists.find((l) =>
      l.tracks.some((t) => t.id === activeId),
    );

    if (list) {
      const oldIndex = list.tracks.findIndex((t) => t.id === activeId);
      const newIndex = list.tracks.findIndex((t) => t.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        const newTracks = arrayMove(list.tracks, oldIndex, newIndex);

        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => {
            if (l.id === list.id) {
              return { ...l, tracks: newTracks };
            }
            return l;
          }),
        }));

        const orderUpdates = newTracks.map((track, index) => ({
          id: track.id,
          order: index,
        }));

        await updateTracksOrder(orderUpdates);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={handleCollision}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='flex gap-8 h-full items-start'>
        {board.lists.map((stage) => {
          // Konvertera alla tracks i kolumnen till AudioTrack-formatet EN gång här
          const columnAudioTracks = stage.tracks.map(mapToAudioTrack);

          return (
            <section
              key={stage.id}
              className='w-80 shrink-0 bg-zinc-900/20 p-4 rounded-xl border border-white/5 flex flex-col'
            >
              <div className='flex items-center justify-between mb-6 border-b border-white/5 pb-2'>
                <h2 className='text-[11px] uppercase tracking-[0.4em] text-zinc-400 font-black'>
                  {stage.title}
                </h2>
                <span className='text-[10px] font-mono text-zinc-600 bg-black/40 px-2 py-0.5 rounded'>
                  {stage.tracks.length}
                </span>
              </div>

              <SortableContext
                id={stage.id}
                items={stage.tracks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={`flex flex-col gap-4 ${stage.tracks.length === 0 ? 'min-h-25 ...' : ''}`}
                >
                  {stage.tracks.map((track) => (
                    <SortableTrack
                      key={track.id}
                      track={mapToAudioTrack(track)}
                      allTracksInColumn={columnAudioTracks}
                    />
                  ))}
                </div>
              </SortableContext>

              <div className='mt-4'>
                <AddTrack stageId={stage.id} />
              </div>
            </section>
          );
        })}
      </div>
    </DndContext>
  );
}
