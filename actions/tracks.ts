'use server';

import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createTrack(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = formData.get('title') as string;
    const stageId = formData.get('stageId') as string;
    const bpm = formData.get('bpm')
      ? parseInt(formData.get('bpm') as string)
      : null;
    const key = formData.get('key') as string;
    const audioFile = formData.get('audio') as File | null;

    let publicUrl = null;

    // Vi kollar om en fil faktiskt valdes genom att kontrollera storleken
    if (audioFile && audioFile.size > 0) {
      const fileExtension = audioFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExtension}`;
      const filePath = `${stageId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(filePath, audioFile);

      if (uploadError) {
        console.error('Supabase Error:', uploadError.message);
        return { success: false, error: 'Kunde inte ladda upp filen.' };
      }

      const { data } = supabase.storage.from('tracks').getPublicUrl(filePath);
      publicUrl = data.publicUrl;
    }

    const trackCount = await db.track.count({ where: { stageId } });

    await db.track.create({
      data: {
        title,
        stageId,
        bpm,
        key,
        order: trackCount,
        audioUrl: publicUrl, // Sparas som null om ingen fil laddades upp
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return { success: false, error: 'Ett fel uppstod i databasen.' };
  }
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

export async function uploadAudio(trackId: string, formData: FormData) {
  const file = formData.get('audio') as File;
  if (!file) return { error: 'Ingen fil vald' };

  const fileName = `${trackId}-${Date.now()}`;

  const { data, error } = await supabase.storage
    .from('tracks')
    .upload(fileName, file);

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from('tracks').getPublicUrl(data.path);

  await db.track.update({
    where: { id: trackId },
    data: { audioUrl: publicUrl },
  });

  revalidatePath('/');
  return { success: true };
}
