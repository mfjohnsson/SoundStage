import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.board.create({
    data: {
      title: 'Album: Neon Dreams',
      lists: {
        create: [
          {
            title: 'Skisser',
            order: 1,
            tracks: {
              create: [
                { title: 'Intro Synth', bpm: 120, key: 'Am', order: 1 },
                { title: 'Midnight Drive', bpm: 115, key: 'Emaj', order: 2 },
              ],
            },
          },
          {
            title: 'Mixing',
            order: 2,
            tracks: {
              create: [
                {
                  title: 'Neon Nights (Final Mix)',
                  bpm: 128,
                  key: 'Gm',
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('Databasen fylld!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
