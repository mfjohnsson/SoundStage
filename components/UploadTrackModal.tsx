'use client';

import { createTrack, uploadAudio } from '@/actions/tracks';
import { X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useFormStatus } from 'react-dom'; // Importera denna för stabil laddningsstatus
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';

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
  const backdropRef = useRef<HTMLDivElement>(null);

  async function clientAction(formData: FormData) {
    setError(null);
    const audioFile = formData.get('audio') as File;
    let audioUrl = null;

    try {
      // 1. Om en fil har valts, ladda upp den direkt till Supabase från webbläsaren
      if (audioFile && audioFile.size > 0) {
        // Kontrollera storlek (valfritt men bra)
        if (audioFile.size > 10 * 1024 * 1024) {
          // 10MB gräns
          setError('Filen är för stor (max 10MB)');
          return;
        }

        const fileName = `${Date.now()}-${audioFile.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('audio-tracks')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;

        // Hämta den publika URL:en
        const { data: urlData } = supabase.storage
          .from('audio-tracks')
          .getPublicUrl(data.path);

        audioUrl = urlData.publicUrl;
      }

      // 2. Förbered data för Server Action (utan den tunga filen)
      // Vi skickar URL:en istället för File-objektet
      const payload = new FormData();
      if (stageId) payload.append('stageId', stageId);
      if (trackId) payload.append('trackId', trackId);
      if (audioUrl) payload.append('audioUrl', audioUrl); // Skicka URL:en här

      const title = formData.get('title');
      if (title) payload.append('title', title as string);

      const bpm = formData.get('bpm');
      const key = formData.get('key');
      if (bpm) payload.append('bpm', bpm as string);
      if (key) payload.append('key', key as string);
      if (audioUrl) {
        payload.append('audioUrl', audioUrl); // Skicka BARA strängen/länken
      }

      // 3. Kör Server Action med URL istället för fil
      const result = trackId
        ? await uploadAudio(trackId, payload) // Du kan behöva justera uploadAudio att ta emot en URL istället för File
        : await createTrack(payload);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Något gick fel vid sparandet.');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ett oväntat fel uppstod.';
      setError(errorMessage);
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      // STOPPA DND: Vi använder onPointerDown för att fånga klicket innan dnd-kit gör det
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.target === backdropRef.current) {
          onClose();
        }
      }}
      // Förhindra alla mus-events från att nå Board
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-9999 p-4 font-sans'
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className='bg-zinc-900 border border-accent/30 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200'
        // Inuti boxen ska klick inte stänga modalen
        onPointerDown={(e) => e.stopPropagation()}
      >
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

          <SubmitButton />
        </form>
      </div>
    </div>,
    document.body,
  );
}
