import { db } from '@/lib/db';
import Board from '@/components/Board';
import Navbar from '@/components/Navbar';
import { FullBoard } from '@/types';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>;
}) {
  const { boardId } = await searchParams;

  const boards = await db.board.findMany({
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: { tracks: { orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!boards.length)
    return <div>Inget projekt hittades. Kör seed-scriptet!</div>;

  const activeBoard = boards.find((b) => b.id === boardId) ?? boards[0];

  return (
    <div className='flex flex-col min-h-screen bg-background text-foreground font-sans'>
      <Navbar boards={boards} activeBoard={activeBoard} />
      <main className='flex-1 p-8 overflow-x-auto'>
        <Board initialData={activeBoard as FullBoard} />
      </main>
    </div>
  );
}
