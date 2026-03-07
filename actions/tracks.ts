'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createTrack(formData: FormData) {
  const title = formData.get('title') as string;
  const stageId = formData.get('stageId') as string;
  const bpm = formData.get('bpm')
    ? parseInt(formData.get('bpm') as string)
    : null;
  const key = formData.get('key') as string;

  // 1. Räkna hur många låtar som redan finns i denna stage
  const trackCount = await db.track.count({
    where: { stageId },
  });

  // 2. Skapa den nya låten med order = trackCount (eftersom det är 0-indexerat)
  await db.track.create({
    data: {
      title,
      stageId,
      bpm,
      key,
      order: trackCount, // Denna rad gör att den hamnar sist
    },
  });

  revalidatePath('/');
}
export async function updateTrackPosition(trackId: string, newStageId: string) {
  try {
    await db.track.update({
      where: { id: trackId },
      data: { stageId: newStageId },
    });
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to update position:', error);
  }
}

export async function deleteTrack(id: string) {
  await db.track.delete({
    where: { id },
  });

  revalidatePath('/');
}

export async function updateTrack(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const bpm = formData.get('bpm')
    ? parseInt(formData.get('bpm') as string)
    : null;
  const key = formData.get('key') as string;

  await db.track.update({
    where: { id },
    data: {
      title,
      bpm,
      key,
    },
  });

  revalidatePath('/');
}

export async function updateTracksOrder(
  tracks: { id: string; order: number }[],
) {
  try {
    // Vi kör alla uppdateringar i en "transaction" så att allt händer samtidigt
    await db.$transaction(
      tracks.map((track) =>
        db.track.update({
          where: { id: track.id },
          data: { order: track.order },
        }),
      ),
    );
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to update order:', error);
  }
}
