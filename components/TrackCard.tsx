// Ersätt hela TrackCard.tsx med denna städade version:

'use client';

import { useEffect, useState, useRef, memo } from 'react';
import {
  Upload,
  MoreVertical,
  Pause,
  Play,
  Music,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { deleteTrack, updateTrack } from '@/actions/tracks';
import UploadTrackModal from './UploadTrackModal';
import { useAudio, AudioTrack } from '@/context/AudioContext';

interface TrackProps extends Omit<AudioTrack, 'key'> {
  keySig?: string | null;
  allTracksInColumn: AudioTrack[]; // optional callback invoked when user presses play
}
const TrackCard = memo(
  function TrackCard({
    id,
    title,
    bpm,
    keySig,
    audioUrl,
    allTracksInColumn,
  }: TrackProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    // Stäng menyn vid klick utanför
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        // Om menyn är öppen OCH klicket sker utanför menuRef (menyn)
        if (
          showMenu &&
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setShowMenu(false);
        }
      }

      // Lägg till lyssnaren när komponenten laddas
      document.addEventListener('mousedown', handleClickOutside);

      // Städa upp lyssnaren när komponenten tas bort
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showMenu]);

    const handleUpdate = async (formData: FormData) => {
      await updateTrack(id, formData);
      setIsEditing(false);
      setShowMenu(false);
    };

    const { playTrack, currentTrack, setPlaylist, isPlaying, togglePlay } =
      useAudio();
    const isActive = currentTrack?.id === id;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      // Om den redan spelar, pausa bara
      if (isActive) {
        togglePlay();
        return;
      }

      // 1. Filtrera och omvandla listan så att den matchar AudioTrack-typen
      const playableTracks: AudioTrack[] = allTracksInColumn
        .filter((t) => t.audioUrl) // Ta bara de med ljud
        .map((t) => ({
          id: t.id,
          title: t.title,
          bpm: t.bpm ?? undefined,
          key: t.key ?? undefined,
          audioUrl: t.audioUrl,
        }));

      // 2. Uppdatera playlisten i spelaren
      setPlaylist(playableTracks);

      // 3. Starta den valda låten
      playTrack({
        id,
        title,
        bpm,
        key: keySig,
        audioUrl,
      });
    };

    if (isEditing) {
      return (
        <div className='bg-zinc-900 border border-accent/40 rounded-md p-4 shadow-xl relative overflow-hidden'>
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-accent' />
          <form action={handleUpdate} className='flex flex-col gap-3'>
            <input
              name='title'
              defaultValue={title}
              onPointerDown={(e) => e.stopPropagation()}
              className='bg-black/40 border border-white/10 rounded p-2 text-sm text-white outline-none focus:border-accent w-full'
              autoFocus
            />
            <div className='flex gap-2'>
              <input
                name='bpm'
                type='number'
                defaultValue={bpm ?? undefined}
                onPointerDown={(e) => e.stopPropagation()}
                className='bg-black/40 border border-white/10 rounded p-2 text-[12px] font-mono text-accent w-1/2 outline-none'
                placeholder='BPM'
              />
              <input
                name='key'
                defaultValue={keySig ?? undefined}
                onPointerDown={(e) => e.stopPropagation()}
                className='bg-black/40 border border-white/10 rounded p-2 text-[12px] font-mono text-zinc-400 w-1/2 outline-none'
                placeholder='Key'
              />
            </div>
            <div className='flex gap-2 mt-1'>
              <button
                type='submit'
                className='flex-1 flex items-center justify-center gap-2 bg-accent text-black py-2 rounded text-xs font-bold uppercase tracking-widest'
              >
                <Check className='w-3 h-3' /> Save
              </button>
              <button
                type='button'
                onClick={() => setIsEditing(false)}
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
      <div className='bg-card border border-white/5 rounded-md p-4 shadow-xl hover:border-accent/40 transition-[border-color,transform] duration-200 group relative overflow-hidden select-none'>
        <div className='absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors duration-200' />

        <div className='flex justify-between items-start mb-4'>
          <div className='p-2 bg-accent/10 rounded border border-accent/20'>
            <Music className='w-4 h-4 text-accent' />
          </div>

          <div className='relative' ref={menuRef}>
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
              <div className='absolute right-0 top-8 w-40 bg-zinc-800 border border-white/10 rounded-md shadow-xl z-100 overflow-hidden'>
                <button
                  className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/5 transition-colors'
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                >
                  <Edit2 className='w-3 h-3' /> EDIT INFO
                </button>

                <button
                  className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/5 transition-colors border-t border-white/5'
                  onClick={() => {
                    setIsUploadOpen(true);
                    setShowMenu(false);
                  }}
                >
                  <Upload className='w-3 h-3' />{' '}
                  {audioUrl ? 'REPLACE AUDIO' : 'UPLOAD AUDIO'}
                </button>

                <button
                  className='w-full flex items-center gap-2 px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5'
                  onClick={async () => {
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

        {audioUrl ? (
          <button
            onClick={handleClick}
            className='flex items-center justify-center gap-3 w-full p-3 bg-accent/20 rounded-full text-accent hover:bg-accent hover:text-black transition-all font-bold text-sm'
          >
            {isActive && isPlaying ? (
              <Pause size={20} fill='currentColor' />
            ) : (
              <Play size={20} fill='currentColor' className='ml-1' />
            )}
            <span>Play Song</span>
          </button>
        ) : (
          <div className='text-[10px] text-zinc-600 uppercase tracking-widest text-center p-3 border border-white/5 rounded-full italic'>
            No audio uploaded
          </div>
        )}

        {isUploadOpen && (
          <UploadTrackModal
            trackId={id} // Skicka med ID så vi vet vilken låt som ska uppdateras
            onClose={() => setIsUploadOpen(false)}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 2. LOGIKEN: Returnera true om komponenten INTE ska rendera om.
    // Vi vill bara rendera om ifall ID, titel, bpm eller key ändras (från DB-uppdateringar).
    // Vi ignorerar att 'currentTrack' eller 'progress' ändras i contexten.
    return (
      prevProps.id === nextProps.id &&
      prevProps.title === nextProps.title &&
      prevProps.bpm === nextProps.bpm &&
      prevProps.keySig === nextProps.keySig &&
      prevProps.audioUrl === nextProps.audioUrl
    );
  },
);

export default TrackCard;
