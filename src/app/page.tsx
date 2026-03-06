import { db } from '@/lib/db';
import Board from '@/components/Board';
import { FullBoard } from '@/types';

export default async function Home() {
  const boards = await db.board.findMany({
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: {
          tracks: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  const activeBoard = boards[0];

  if (!activeBoard)
    return <div>Inget projekt hittades. Kör seed-scriptet!</div>;

  return (
    <div className='flex flex-col min-h-screen bg-background text-foreground font-sans'>
      <header className='bg-secondary p-6 border-b border-white/5 flex justify-between items-end'>
        <div>
          <h1 className='text-2xl font-black tracking-tighter uppercase italic'>
            Sound<span className='text-accent italic'>Stage</span>
          </h1>
          <p className='text-zinc-500 text-[10px] uppercase tracking-[0.3em] mt-1'>
            Project // {activeBoard.title}
          </p>
        </div>
        <div className='text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full animate-pulse'>
          • STUDIO ONLINE
        </div>
      </header>

      <main className='flex-1 p-8 overflow-x-auto'>
        <Board initialData={activeBoard as FullBoard} />
      </main>
    </div>
  );
}
