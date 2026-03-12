'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createBoard(title: string) {
  const board = await db.board.create({
    data: {
      title,
      lists: {
        create: [
          { title: 'Skiss', order: 0 },
          { title: 'Demo', order: 1 },
          { title: 'Mix', order: 2 },
          { title: 'Master', order: 3 },
        ],
      },
    },
  });

  revalidatePath('/');
  return board;
}

export async function updateBoard(id: string, title: string) {
  await db.board.update({ where: { id }, data: { title } });
  revalidatePath('/');
}

export async function deleteBoard(id: string) {
  await db.board.delete({ where: { id } });
  revalidatePath('/');
}
