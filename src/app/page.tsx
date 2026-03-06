import { db } from '@/lib/db'; // Din Prisma-klient
import TrackCard from '@/components/TrackCard';

export default async function Home() {
  // 1. Hämta datan från Supabase
  const boards = await db.board.findMany({
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: {
          tracks: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  // Vi tar det första boardet för enkelhetens skull just nu
  const activeBoard = boards[0];

  return (
    <div className='flex flex-col min-h-screen bg-background text-foreground font-sans'>
      <header className='bg-secondary p-6 border-b border-white/5 flex justify-between items-end'>
        <div>
          <h1 className='text-2xl font-black tracking-tighter uppercase italic'>
            Sound<span className='text-accent italic'>Stage</span>
          </h1>
          <p className='text-zinc-500 text-[10px] uppercase tracking-[0.3em] mt-1'>
            {activeBoard ? activeBoard.title : 'No Project Loaded'}
          </p>
        </div>
        <div className='text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full animate-pulse'>
          • STUDIO ONLINE
        </div>
      </header>

      <main className='flex-1 p-8 overflow-x-auto bg-[radial-gradient(circle_at_top_right,var(--color-secondary),transparent)]'>
        <div className='flex gap-8 h-full'>
          {activeBoard?.lists.map((stage) => (
            <section key={stage.id} className='w-80 shrink-0'>
              <div className='flex items-center justify-between mb-6 border-b border-white/5 pb-2'>
                <h2 className='text-[11px] uppercase tracking-[0.4em] text-zinc-400 font-black'>
                  {stage.title}
                </h2>
                <span className='text-[10px] font-mono text-zinc-600'>
                  {stage.tracks.length}
                </span>
              </div>

              <div className='flex flex-col gap-4'>
                {stage.tracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    title={track.title}
                    bpm={track.bpm ?? undefined}
                    keySig={track.key ?? undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
