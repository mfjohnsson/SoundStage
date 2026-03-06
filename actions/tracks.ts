'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createTrack(formData: FormData) {
  const title = formData.get('title') as string;
  const stageId = formData.get('stageId') as string;
  const bpm = parseInt(formData.get('bpm') as string) || 0;

  await db.track.create({
    data: {
      title,
      stageId,
      bpm,
      order: 0, // Vi kan fixa logik för ordning senare
    },
  });

  revalidatePath('/');
}
