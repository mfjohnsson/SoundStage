'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverEvent,
  DragEndEvent,
  closestCenter,
  useDroppable,
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
import { Track } from '@prisma/client';

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
      activationConstraint: {
        distance: 5, // Lite känsligare distans för snabbare respons
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCollision: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    // Om vi är över något, prioritera det
    if (pointerCollisions.length > 0) return pointerCollisions;

    // Annars, använd center-punkten för att hitta rätt kolumn
    return closestCenter(args);
  };

  if (!mounted) return <div className='flex gap-8 h-full opacity-0' />;

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeList = board.lists.find((l) =>
      l.tracks.some((t: Track) => t.id === activeId),
    );

    // Hitta listan man hovrar över (antingen via lista-ID eller track-ID)
    const overList =
      board.lists.find((l) => l.id === overId) ||
      board.lists.find((l) => l.tracks.some((t) => t.id === overId));

    if (!activeList || !overList || activeList.id === overList.id) return;

    setBoard((prev) => {
      const activeTrack = activeList.tracks.find(
        (t: Track) => t.id === activeId,
      )!;
      const isOverATrack = overList.tracks.some((t: Track) => t.id === overId);

      let newIndex = overList.tracks.length;
      if (isOverATrack) {
        newIndex = overList.tracks.findIndex((t: Track) => t.id === overId);
      }

      return {
        ...prev,
        lists: prev.lists.map((list) => {
          if (list.id === activeList.id) {
            return {
              ...list,
              tracks: list.tracks.filter((t: Track) => t.id !== activeId),
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

    // Uppdatera DB när vi byter kolumn
    await updateTrackPosition(activeId, overList.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const list = board.lists.find((l) =>
      l.tracks.some((t: Track) => t.id === activeId),
    );

    if (list) {
      const oldIndex = list.tracks.findIndex((t: Track) => t.id === activeId);
      const newIndex = list.tracks.findIndex((t: Track) => t.id === overId);

      if (oldIndex !== newIndex && newIndex !== -1) {
        // 1. Skapa den nya ordningen lokalt först
        const newTracks = arrayMove(list.tracks, oldIndex, newIndex);

        // 2. Uppdatera det du ser på skärmen (UI)
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((l) => {
            if (l.id === list.id) {
              return { ...l, tracks: newTracks };
            }
            return l;
          }),
        }));

        // 3. Förbered listan för databasen
        // Vi mappar om låtarna så att varje ID får ett nytt "order"-nummer (0, 1, 2...)
        const orderUpdates = newTracks.map((track, index) => ({
          id: track.id,
          order: index,
        }));

        // 4. Skicka till servern (denna action skapade vi i förra steget)
        await updateTracksOrder(orderUpdates);
      }
    }
  };

  // En enkel wrapper för att göra ytan "känslig" för drops
  function DroppableContainer({
    id,
    children,
    tracksCount,
  }: {
    id: string;
    children: React.ReactNode;
    tracksCount: number;
  }) {
    const { setNodeRef } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        id={id}
        className={`flex flex-col gap-4 transition-colors ${tracksCount === 0 ? 'min-h-25 border-2 border-dashed border-white/5 rounded-xl p-4' : ''}`}
      >
        {children}
        {tracksCount === 0 && (
          <div className='flex-1 flex items-center justify-center pointer-events-none'>
            <span className='text-[10px] text-zinc-700 uppercase tracking-widest'>
              Drop here
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={handleCollision}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='flex gap-8 h-full items-start'>
        {board.lists.map((stage) => (
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
              items={stage.tracks.map((t: Track) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableContainer
                id={stage.id}
                tracksCount={stage.tracks.length}
              >
                {/* 1. Riktiga tracks */}
                {stage.tracks.map((track: Track) => (
                  <SortableTrack key={track.id} track={track} />
                ))}
              </DroppableContainer>
            </SortableContext>

            <div className='mt-4'>
              <AddTrack stageId={stage.id} />
            </div>
          </section>
        ))}
      </div>
    </DndContext>
  );
}
