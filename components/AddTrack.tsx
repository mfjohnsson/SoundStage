'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createTrack } from '@/actions/tracks';

export default function AddTrack({ stageId }: { stageId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='w-full py-3 px-4 rounded-lg border border-dashed border-white/10 text-zinc-500 hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest'
      >
        <Plus className='w-4 h-4' />
        New Track
      </button>
    );
  }

  return (
    <div className='bg-card border border-accent/30 rounded-lg p-4 shadow-2xl animate-in fade-in zoom-in duration-200'>
      <form
        action={async (formData) => {
          await createTrack(formData);
          setIsOpen(false);
        }}
        className='flex flex-col gap-3'
      >
        <input type='hidden' name='stageId' value={stageId} />

        <div className='flex justify-between items-center mb-1'>
          <span className='text-[10px] text-accent font-black tracking-widest uppercase'>
            Add to Stage
          </span>
          <button type='button' onClick={() => setIsOpen(false)}>
            <X className='w-4 h-4 text-zinc-500 hover:text-white' />
          </button>
        </div>

        <input
          name='title'
          autoFocus
          placeholder='Track Title...'
          className='bg-black/40 border border-white/5 rounded p-2 text-sm outline-none focus:border-accent/50 text-white placeholder:text-zinc-700'
          required
        />

        <div className='flex gap-2'>
          <input
            name='bpm'
            type='number'
            placeholder='BPM'
            className='bg-black/40 border border-white/5 rounded p-2 text-xs outline-none focus:border-accent/50 text-white w-20 font-mono'
          />

          <input
            name='key'
            placeholder='Key'
            className='bg-black/40 border border-white/5 rounded p-2 text-xs outline-none focus:border-accent/50 text-white w-24 font-mono'
          />

          <button
            type='submit'
            className='flex-1 bg-accent hover:bg-hoveraccent text-black font-black text-[10px] uppercase tracking-tighter py-2 rounded transition-colors'
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}
