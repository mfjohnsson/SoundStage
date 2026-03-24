'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { FullBoard } from '@/types';
import { SortableTrack } from './SortableTrack';
import { updateTrackPosition, updateTracksOrder } from '@/actions/tracks';
import { useAudio } from '@/context/AudioContext';
import AddTrack from './AddTrack';
import TrackCard from './TrackCard';
import DroppableZone from './DroppableZone';

export default function Board({ initialData }: { initialData: FullBoard }) {
  const [board, setBoard] = useState(initialData);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { currentTrack, setPlaylist } = useAudio();
  const { selectedTrackId, setSelectedTrackId } = useAudio();

  // Ser till att piltangenterna fungerar som navigation mellan tracks
  useEffect(() => {
    window.addEventListener(
      'keydown',
      (e) => {
        console.log(
          'Board keydown:',
          e.key,
          'selectedTrackId:',
          selectedTrackId,
          'focus:',
          document.activeElement,
        );
      },
      true,
    );
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Blockera scroll när ett kort är valt
      if (selectedTrackId && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();

        const currentList = board.lists.find((l) =>
          l.tracks.some((t) => t.id === selectedTrackId),
        );
        if (!currentList) return;

        const currentIndex = currentList.tracks.findIndex(
          (t) => t.id === selectedTrackId,
        );
        let newId: string | null = null;

        if (e.key === 'ArrowUp' && currentIndex > 0) {
          newId = currentList.tracks[currentIndex - 1].id;
        }
        if (
          e.key === 'ArrowDown' &&
          currentIndex < currentList.tracks.length - 1
        ) {
          newId = currentList.tracks[currentIndex + 1].id;
        }

        if (newId) {
          setSelectedTrackId(newId);
          setTimeout(() => {
            const el = document.querySelector(
              `[data-track-id="${newId}"]`,
            ) as HTMLElement;
            el?.focus();
          }, 0);
        }
      }
    };

    // Viktigt: useCapture = true så vi fångar händelsen INNAN browsern hinner scrolla
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [board, selectedTrackId, setSelectedTrackId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Kolla om klicket skedde på ett track-kort
      const clickedCard = (e.target as HTMLElement).closest(
        '[data-track-card]',
      );
      if (!clickedCard) {
        setSelectedTrackId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setSelectedTrackId]);

  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  });

  useEffect(() => {
    if (!currentTrack) return;

    // Hitta vilken kolumn det aktiva spåret befinner sig i just nu
    const currentList = board.lists.find((l) =>
      l.tracks.some((t) => t.id === currentTrack.id),
    );

    if (currentList) {
      const playableTracks = currentList.tracks
        .filter((t) => t.audioUrl)
        .map((t) => ({
          id: t.id,
          title: t.title,
          bpm: t.bpm ?? undefined,
          key: t.key ?? undefined,
          audioUrl: t.audioUrl,
        }));

      setPlaylist(playableTracks);
    }
  }, [board, currentTrack, setPlaylist]); // Kör varje gång board ändras (dvs efter varje drag)

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setBoard((prev) => {
      const activeListIndex = prev.lists.findIndex((l) =>
        l.tracks.some((t) => t.id === activeId),
      );
      if (activeListIndex === -1) return prev;

      // Target: either the list itself (drop on empty zone) or the list containing overId
      const overListIndex = prev.lists.findIndex(
        (l) => l.id === overId || l.tracks.some((t) => t.id === overId),
      );
      if (overListIndex === -1) return prev;

      // Same list – let SortableContext handle reordering; nothing to do here
      if (activeListIndex === overListIndex) return prev;

      // Moving between lists
      const activeTrack = prev.lists[activeListIndex].tracks.find(
        (t) => t.id === activeId,
      )!;

      const newLists = prev.lists.map((list, idx) => {
        if (idx === activeListIndex) {
          return {
            ...list,
            tracks: list.tracks.filter((t) => t.id !== activeId),
          };
        }
        if (idx === overListIndex) {
          // Insert before the card we're hovering, or append at end
          const overTrackIndex = list.tracks.findIndex((t) => t.id === overId);
          const insertAt =
            overTrackIndex === -1 ? list.tracks.length : overTrackIndex;
          const newTracks = [...list.tracks];
          newTracks.splice(insertAt, 0, activeTrack);
          return { ...list, tracks: newTracks };
        }
        return list;
      });

      return { ...prev, lists: newLists };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    document.body.style.cursor = '';

    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Use fresh board state (after all dragOver updates)
    const currentBoard = boardRef.current;

    const activeList = currentBoard.lists.find((l) =>
      l.tracks.some((t) => t.id === activeId),
    );
    if (!activeList) return;

    // Handle reordering within the same list
    const oldIndex = activeList.tracks.findIndex((t) => t.id === activeId);
    let newIndex = activeList.tracks.findIndex((t) => t.id === overId);

    if (newIndex === -1) {
      // Dropped on the column itself – move to end
      newIndex = activeList.tracks.length - 1;
    }

    if (oldIndex !== newIndex) {
      const newTracks = arrayMove(activeList.tracks, oldIndex, newIndex);

      setBoard((prev) => ({
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === activeList.id ? { ...l, tracks: newTracks } : l,
        ),
      }));

      await updateTracksOrder(
        newTracks.map((track, index) => ({ id: track.id, order: index })),
      );
    }

    // Always persist the list (stageId) the track ended up in
    const originList = initialData.lists.find((l) =>
      l.tracks.some((t) => t.id === activeId),
    );
    if (originList?.id !== activeList.id) {
      await updateTrackPosition(activeId, activeList.id);
    }
  };

  const activeTrack = activeId
    ? board.lists.flatMap((l) => l.tracks).find((t) => t.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={handleCollision}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        document.body.style.cursor = '';
        setActiveId(null);
      }}
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
              items={stage.tracks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <DroppableZone id={stage.id} tracksCount={stage.tracks.length}>
                {stage.tracks.map((track) => (
                  <SortableTrack
                    key={track.id}
                    track={track}
                    allTracksInColumn={stage.tracks}
                  />
                ))}
              </DroppableZone>
            </SortableContext>

            <div className='mt-4'>
              <AddTrack stageId={stage.id} />
            </div>
          </section>
        ))}
      </div>

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeTrack ? (
          <div className='opacity-90 rotate-1 scale-105 pointer-events-none'>
            <TrackCard
              id={activeTrack.id}
              title={activeTrack.title}
              bpm={activeTrack.bpm}
              keySig={activeTrack.key}
              audioUrl={activeTrack.audioUrl}
              allTracksInColumn={[]}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
