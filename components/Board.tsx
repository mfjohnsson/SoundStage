'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverEvent,
  DragEndEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FullBoard } from '@/types'; // Se till att skapa denna typ eller definiera den här
import { SortableTrack } from './SortableTrack';
import AddTrack from './AddTrack';
import { updateTrackPosition } from '@/actions/tracks';
import { Track } from '@prisma/client';

export default function Board({ initialData }: { initialData: FullBoard }) {
  const [board, setBoard] = useState(initialData);
  const [mounted, setMounted] = useState(false);

  // Fixar Hydration: Vänta tills komponenten är monterad på klienten
  useEffect(() => {
    setMounted(true);
  }, []);

  // Synka board-state när initialData ändras (t.ex. när en ny track läggs till)
  useEffect(() => {
    setBoard(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Öka till 8 pixlar för att särskilja klick från drag ännu bättre
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Om vi inte är monterade än, rendera en "statisk" version eller inget alls
  // Detta förhindrar att dnd-kit-attributen krockar med server-HTML:en
  if (!mounted) {
    return (
      <div className='flex gap-8 h-full opacity-0'>
        {/* En tom eller genomskinlig placeholder för att undvika layout-shift */}
      </div>
    );
  }

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 1. Hitta käll-listan
    const activeList = board.lists.find((l) =>
      l.tracks.some((t: Track) => t.id === activeId),
    );

    // 2. Hitta mål-listan (Vi kollar både om man är över ett Track ELLER själva Stage-id:t)
    const overList = board.lists.find(
      (l) => l.id === overId || l.tracks.some((t: Track) => t.id === overId),
    );

    if (!activeList || !overList) return;

    // Om vi byter kolumn
    if (activeList.id !== overList.id) {
      setBoard((prev) => {
        const activeTrack = activeList.tracks.find(
          (t: Track) => t.id === activeId,
        )!;

        const isOverATrack = overList.tracks.some(
          (t: Track) => t.id === overId,
        );
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

      await updateTrackPosition(activeId, overList.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeList = board.lists.find((l) =>
      l.tracks.some((t: Track) => t.id === activeId),
    );

    if (activeList && activeId !== overId) {
      const oldIndex = activeList.tracks.findIndex(
        (t: Track) => t.id === activeId,
      );
      const newIndex = activeList.tracks.findIndex(
        (t: Track) => t.id === overId,
      );

      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((list) => {
          if (list.id === activeList.id) {
            return {
              ...list,
              tracks: arrayMove(list.tracks, oldIndex, newIndex),
            };
          }
          return list;
        }),
      }));

      // Här kan vi senare lägga till en Server Action för att spara 'order' i DB
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className='flex gap-8 h-full'>
        {board.lists.map((stage) => (
          <section key={stage.id} className='w-80 shrink-0'>
            <div className='flex items-center justify-between mb-6 border-b border-white/5 pb-2'>
              <h2 className='text-[11px] uppercase tracking-[0.4em] text-zinc-400 font-black'>
                {stage.title}
              </h2>
              <span className='text-[10px] font-mono text-zinc-600'>
                {stage.tracks.length}
              </span>
            </div>

            <SortableContext
              id={stage.id}
              items={stage.tracks.map((t: Track) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='flex flex-col gap-4 min-h-50'>
                {stage.tracks.map((track: Track) => (
                  <SortableTrack key={track.id} track={track} />
                ))}
                {/* Flytta AddTrack så den ligger sist i div:en men fortfarande synlig */}
              </div>
            </SortableContext>
            {/* Du kan också testa att lägga den precis under SortableContext om det strular */}
            <div className='mt-4'>
              <AddTrack stageId={stage.id} />
            </div>
          </section>
        ))}
      </div>
    </DndContext>
  );
}
