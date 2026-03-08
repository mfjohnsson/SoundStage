'use client';

import { createTrack, uploadAudio } from '@/actions/tracks';
import { X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom'; // Importera denna för stabil laddningsstatus

interface Props {
  stageId?: string;
  trackId?: string;
  onClose: () => void;
}

// 1. Skapa en separat komponent för knappen för att använda useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      className='mt-2 w-full bg-accent hover:bg-hoveraccent text-black font-black text-[10px] uppercase tracking-widest py-3 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
    >
      {pending ? (
        <>
          <Loader2 className='w-3 h-3 animate-spin' />
          <span>Uploading...</span>
        </>
      ) : (
        'Confirm'
      )}
    </button>
  );
}

export default function UploadTrackModal({ stageId, trackId, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) {
      onClose();
    }
  };

  // Vi använder en "Client Action" för att hantera stängning och fel
  async function clientAction(formData: FormData) {
    setError(null);
    try {
      const result = trackId
        ? await uploadAudio(trackId, formData)
        : await createTrack(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Något gick fel vid uppladdningen.');
      }
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel uppstod på servern.');
    }
  }

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 font-sans'
    >
      <div
        className='bg-zinc-900 border border-accent/30 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200'
        onClick={(e) => e.stopPropagation()} // Hindra klick inuti modalen från att stänga den
      >
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <span className='text-[10px] text-accent font-black tracking-widest uppercase'>
            {trackId ? 'Upload Audio' : 'Create New Track'}
          </span>
          <button
            onClick={onClose}
            className='p-1 hover:bg-white/5 rounded transition-colors'
          >
            <X className='w-4 h-4 text-zinc-500 hover:text-white' />
          </button>
        </div>

        <form action={clientAction} className='flex flex-col gap-4'>
          {stageId && <input type='hidden' name='stageId' value={stageId} />}
          {trackId && <input type='hidden' name='trackId' value={trackId} />}

          {!trackId && (
            <input
              name='title'
              autoFocus
              placeholder='Track Title...'
              className='bg-black/40 border border-white/5 rounded p-2 text-sm outline-none focus:border-accent/50 text-white placeholder:text-zinc-700'
              required
            />
          )}

          <div className='grid grid-cols-2 gap-4'>
            {!trackId && (
              <>
                <input
                  name='bpm'
                  type='number'
                  placeholder='BPM'
                  className='bg-black/40 border border-white/5 rounded p-2 text-xs outline-none focus:border-accent/50 text-white font-mono'
                />
                <input
                  name='key'
                  placeholder='Key'
                  className='bg-black/40 border border-white/5 rounded p-2 text-xs outline-none focus:border-accent/50 text-white font-mono'
                />
              </>
            )}
          </div>

          <div className='relative group'>
            <label className='block text-[10px] text-zinc-500 mb-2 uppercase font-bold tracking-tight'>
              Audio File (Optional)
            </label>
            <input
              type='file'
              name='audio'
              accept='audio/*'
              className='w-full text-[10px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-zinc-800 file:text-zinc-300 hover:file:bg-accent hover:file:text-black cursor-pointer transition-all'
            />
          </div>

          {error && (
            <p className='text-red-500 text-[10px] uppercase font-bold animate-pulse py-2'>
              {error}
            </p>
          )}

          {/* Använd den nya SubmitButton-komponenten här */}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
