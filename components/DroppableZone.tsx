import { useDroppable } from '@dnd-kit/core';

// Hjälpkomponent för att aktivera drop-zonen i varje kolumn
export default function DroppableZone({
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
    <div ref={setNodeRef} className='flex flex-col gap-4 min-h-30'>
      {children}
      {tracksCount === 0 && (
        <div className='flex-1 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center'>
          <span className='text-[10px] text-zinc-600 uppercase tracking-widest'>
            Drop here
          </span>
        </div>
      )}
    </div>
  );
}
