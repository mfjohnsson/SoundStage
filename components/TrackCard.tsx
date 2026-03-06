import { Play, MoreVertical, Music } from 'lucide-react';

interface TrackProps {
  title: string;
  bpm?: number;
  keySig?: string;
}

export default function TrackCard({ title, bpm, keySig }: TrackProps) {
  return (
    <div className='bg-card border border-white/5 rounded-md p-4 shadow-xl hover:border-accent/40 transition-all group relative overflow-hidden'>
      {/* En subtil dekorativ linje på sidan för "studio-look" */}
      <div className='absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors' />

      <div className='flex justify-between items-start mb-4'>
        <div className='p-2 bg-accent/10 rounded border border-accent/20'>
          <Music className='w-4 h-4 text-accent' />
        </div>
        <button className='text-zinc-600 hover:text-zinc-300'>
          <MoreVertical className='w-4 h-4' />
        </button>
      </div>

      <h3 className='text-zinc-100 font-bold text-sm tracking-tight mb-3 truncate uppercase'>
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

      <button className='w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-accent hover:text-black text-zinc-300 py-2 rounded text-xs font-bold transition-all uppercase tracking-widest'>
        <Play className='w-3 h-3 fill-current' />
        Load Track
      </button>
    </div>
  );
}
