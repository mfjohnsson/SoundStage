// Ersätt hela TrackCard.tsx med denna städade version:

'use client';

import { useState } from 'react';
import {
  Play,
  MoreVertical,
  Music,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { deleteTrack, updateTrack } from '@/actions/tracks';

interface TrackProps {
  id: string;
  title: string;
  bpm?: number;
  keySig?: string;
}

export default function TrackCard({ id, title, bpm, keySig }: TrackProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (formData: FormData) => {
    await updateTrack(id, formData);
    setIsEditing(false);
    setShowMenu(false);
  };

  if (isEditing) {
    return (
      <div className='bg-card border border-accent/40 rounded-md p-4 shadow-xl relative overflow-hidden'>
        <div className='absolute left-0 top-0 bottom-0 w-1 bg-accent' />
        <form action={handleUpdate} className='flex flex-col gap-3'>
          <input
            name='title'
            defaultValue={title}
            onPointerDown={(e) => e.stopPropagation()} // Hindrar drag vid klick
            className='bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-accent w-full'
            autoFocus
          />
          <div className='flex gap-2'>
            <input
              name='bpm'
              type='number'
              defaultValue={bpm}
              onPointerDown={(e) => e.stopPropagation()}
              className='bg-black/40 border border-white/10 rounded p-2 text-[12px] font-mono text-accent w-1/2 outline-none'
              placeholder='BPM'
            />
            <input
              name='key'
              defaultValue={keySig}
              onPointerDown={(e) => e.stopPropagation()}
              className='bg-black/40 border border-white/10 rounded p-2 text-[12px] font-mono text-zinc-400 w-1/2 outline-none'
              placeholder='Key'
            />
          </div>
          <div className='flex gap-2 mt-1'>
            <button
              type='submit'
              onPointerDown={(e) => e.stopPropagation()}
              className='flex-1 flex items-center justify-center gap-2 bg-accent text-black py-2 rounded text-xs font-bold uppercase tracking-widest'
            >
              <Check className='w-3 h-3' /> Save
            </button>
            <button
              type='button'
              onClick={() => setIsEditing(false)}
              onPointerDown={(e) => e.stopPropagation()}
              className='flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 py-2 rounded text-xs font-bold uppercase tracking-widest'
            >
              <X className='w-3 h-3' /> Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className='bg-card border border-white/5 rounded-md p-4 shadow-xl hover:border-accent/40 transition-all group relative overflow-hidden select-none'>
      <div className='absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors' />

      <div className='flex justify-between items-start mb-4'>
        <div className='p-2 bg-accent/10 rounded border border-accent/20'>
          <Music className='w-4 h-4 text-accent' />
        </div>

        <div className='relative'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className='p-1 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors relative z-50'
          >
            <MoreVertical className='w-4 h-4' />
          </button>

          {showMenu && (
            <div
              className='absolute right-0 top-8 w-32 bg-zinc-800 border border-white/10 rounded-md shadow-xl z-100 overflow-hidden'
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/5 transition-colors'
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
              >
                <Edit2 className='w-3 h-3' /> EDIT
              </button>
              <button
                className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5'
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Är du säker?')) await deleteTrack(id);
                }}
              >
                <Trash2 className='w-3 h-3' /> DELETE
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className='text-zinc-100 font-bold text-sm tracking-tight mb-3 truncate'>
        {title}
      </h3>

      <div className='flex gap-2 mb-5'>
        {bpm && (
          <span className='text-[12px] font-mono bg-black/40 text-accent border border-accent/20 px-2 py-0.5 rounded'>
            {bpm} BPM
          </span>
        )}
        {keySig && (
          <span className='text-[12px] font-mono bg-black/40 text-zinc-400 border border-white/5 px-2 py-0.5 rounded'>
            {keySig}
          </span>
        )}
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        className='w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-accent hover:text-black text-zinc-300 py-2 rounded text-xs font-bold transition-all uppercase tracking-widest'
      >
        <Play className='w-3 h-3 fill-current' />
        Load Track
      </button>
    </div>
  );
}
