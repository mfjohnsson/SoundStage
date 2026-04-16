'use client';

import { createTrack, uploadAudio } from '@/actions/tracks';
import { X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';

interface Props {
  stageId?: string;
  trackId?: string;
  initialFile?: File | null; // Ny prop för Drag & Drop
  onClose: () => void;
}

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

export default function UploadTrackModal({
  stageId,
  trackId,
  initialFile,
  onClose,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(''); // State för kontrollerad titel-input
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref för att styra fil-inputen

  // Hantera förladdad fil från Drag & Drop
  useEffect(() => {
    if (initialFile) {
      // 1. Sätt titeln automatiskt (ta bort filändelsen)
      const cleanTitle = initialFile.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanTitle);

      // 2. Injicera filen i input-fältet via DataTransfer
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(initialFile);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  }, [initialFile]);

  async function clientAction(formData: FormData) {
    setError(null);

    // Hämta filen (prioritera ref om FormData är tom pga injicering)
    const audioFile =
      fileInputRef.current?.files?.[0] || (formData.get('audio') as File);
    let audioUrl = null;

    try {
      if (audioFile && audioFile.size > 0) {
        if (audioFile.size > 50 * 1024 * 1024) {
          setError('Filen är för stor (max 50MB)');
          return;
        }

        const cleanName = audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('tracks')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('tracks')
          .getPublicUrl(fileName);

        audioUrl = urlData.publicUrl;
      }

      const payload = new FormData();
      if (stageId) payload.append('stageId', stageId);
      if (trackId) payload.append('trackId', trackId);

      // Använd title från state om det är ett nytt track
      if (!trackId) {
        payload.append('title', title);
      }

      const bpm = formData.get('bpm');
      const key = formData.get('key');
      if (bpm) payload.append('bpm', bpm as string);
      if (key) payload.append('key', key as string);
      if (audioUrl) {
        payload.append('audioUrl', audioUrl);
      }

      const result = trackId
        ? await uploadAudio(trackId, payload)
        : await createTrack(payload);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Något gick fel vid sparandet.');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ett oväntat fel uppstod.');
    }
  }

  return createPortal(
    <div
      ref={backdropRef}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.target === backdropRef.current) {
          onClose();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-9999 p-4 font-sans'
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className='bg-zinc-900 border border-accent/30 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200'
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!initialFile} // AutoFocus bara om vi inte dragit in en fil
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
              {initialFile ? 'File ready to upload' : 'Audio File (Optional)'}
            </label>
            <input
              ref={fileInputRef}
              type='file'
              name='audio'
              accept='audio/*'
              className='w-full text-[10px] text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-zinc-800 file:text-zinc-300 hover:file:bg-accent hover:file:text-black cursor-pointer transition-all'
            />
            {initialFile && (
              <p className='text-[9px] text-accent mt-1 uppercase font-bold tracking-tighter'>
                Selected: {initialFile.name}
              </p>
            )}
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
