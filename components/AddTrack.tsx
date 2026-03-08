'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import UploadTrackModal from './UploadTrackModal';

export default function AddTrack({ stageId }: { stageId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='w-full py-3 px-4 rounded-lg border border-dashed border-white/10 text-zinc-500 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest'
      >
        <Plus className='w-4 h-4' />
        New Track
      </button>

      {isOpen && (
        <UploadTrackModal stageId={stageId} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
