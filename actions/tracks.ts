'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

export async function createTrack(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const title = formData.get('title') as string;
    const stageId = formData.get('stageId') as string;
    const key = formData.get('key') as string;
    const audioUrl = formData.get('audioUrl') as string | null; // Nu en sträng, inte File

    const bpm = formData.get('bpm')
      ? parseInt(formData.get('bpm') as string)
      : null;

    const trackCount = await db.track.count({ where: { stageId } });

    await db.track.create({
      data: {
        title,
        stageId,
        bpm,
        key,
        order: trackCount,
        audioUrl: audioUrl, // Spara URL:en vi fick från klienten
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

export async function deleteTrack(trackId: string) {

  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY saknas i miljövariablerna!');
  }

  try {
    const track = await db.track.findUnique({
      where: { id: trackId },
    });

    if (track?.audioUrl) {
      const fileName = decodeURIComponent(track.audioUrl.split('/').pop() || '');

      if (fileName) {
        // Vi använder supabaseAdmin här – den har "Gud-rättigheter" och ignorerar RLS
        const { data, error: storageError } = await supabaseAdmin.storage
          .from('tracks')
          .remove([fileName]);

        if (storageError) {
          console.error('Admin Storage Error:', storageError);
        } else {
          console.log("Radering bekräftad av Admin:", data);
        }
      }
    }

    await db.track.delete({ where: { id: trackId } });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Kunde inte radera' };
  }
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
  // Nu är 'audioUrl' bara en vanlig textsträng (URL:en från Supabase)
  const audioUrl = formData.get('audioUrl') as string;

  if (!audioUrl) return { error: 'Ingen URL mottogs' };

  try {
    await db.track.update({
      where: { id: trackId },
      data: { audioUrl: audioUrl },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      success: false,
      error: 'Kunde inte uppdatera spåret i databasen.',
    };
  }
}
