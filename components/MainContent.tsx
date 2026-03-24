'use client';

import { useAudio } from '@/context/AudioContext';
import Board from '@/components/Board';
import { FullBoard } from '@/types';

export default function MainContent({
  activeBoard,
}: {
  activeBoard: FullBoard;
}) {
  const { currentTrack, isPlayerCollapsed } = useAudio();

  return (
    <main
      className={`flex-1 p-8 overflow-x-auto transition-all duration-300 ${
        currentTrack && !isPlayerCollapsed ? 'pb-40' : 'pb-8'
      }`}
    >
      <Board initialData={activeBoard} />
    </main>
  );
}
