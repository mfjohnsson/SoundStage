import { db } from '@/lib/db';
import Board from '@/components/Board';
import Navbar from '@/components/Navbar';
import { FullBoard } from '@/types';
import { cookies } from 'next/headers';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>;
}) {
  const { boardId } = await searchParams;
  const cookieStore = await cookies();
  const lastBoardId = cookieStore.get('lastBoardId')?.value;

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

  const activeBoard =
    boards.find((b) => b.id === boardId) ?? // URL-param först
    boards.find((b) => b.id === lastBoardId) ?? // Sedan senast besökta
    boards[0]; // Fallback

  return (
    <div className='flex flex-col min-h-screen bg-background text-foreground font-sans'>
      <Navbar boards={boards} activeBoard={activeBoard} />
      <main className='flex-1 p-8 overflow-x-auto'>
        <Board initialData={activeBoard as FullBoard} />
      </main>
    </div>
  );
}
