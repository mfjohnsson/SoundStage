'use client';

import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

interface Props {
  id: string;
  children: React.ReactNode;
  tracksCount: number;
  onFileDrop?: (file: File, stageId: string) => void; // Lägg till denna prop
}

export default function DroppableZone({
  id,
  children,
  tracksCount,
  onFileDrop,
}: Props) {
  const { setNodeRef } = useDroppable({ id });
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);

  // 1. Hantera när filer dras över zonen
  const handleDragOver = (e: React.DragEvent) => {
    // Vi kollar om det är filer (inte ett dnd-kit kort)
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault(); // Krävs för att tillåta drop
      setIsExternalDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsExternalDragOver(false);
  };

  // 2. Hantera när filen släpps
  const handleDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsExternalDragOver(false);

      const file = e.dataTransfer.files[0];
      // Kontrollera att det faktiskt är ljud
      if (file.type.startsWith('audio/') && onFileDrop) {
        onFileDrop(file, id);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col gap-4 min-h-30 rounded-xl transition-all duration-200 ${
        isExternalDragOver
          ? 'bg-accent/10 border-2 border-dashed border-accent/40 ring-2 ring-accent/5'
          : ''
      }`}
    >
      {children}

      {/* Visa "Drop here" om kolumnen är tom ELLER om vi drar en fil över den */}
      {(tracksCount === 0 || isExternalDragOver) && (
        <div
          className={`flex-1 border-2 border-dashed rounded-xl flex items-center justify-center min-h-25 transition-colors ${
            isExternalDragOver
              ? 'border-accent/50 bg-accent/5'
              : 'border-white/5'
          }`}
        >
          <span
            className={`text-[10px] uppercase tracking-widest font-black ${
              isExternalDragOver ? 'text-accent animate-pulse' : 'text-zinc-600'
            }`}
          >
            {isExternalDragOver ? 'Release to upload' : 'Drop here'}
          </span>
        </div>
      )}
    </div>
  );
}
