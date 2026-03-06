import { Board, Stage, Track } from '@prisma/client';

export type FullBoard = Board & {
  lists: (Stage & {
    tracks: Track[];
  })[];
};
