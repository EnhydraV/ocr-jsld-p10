// Jeu de donnees de demonstration : une conversation ouverte par Charlie (client) au sujet
// d'une reservation, en attente d'un conseiller. Rejouable : la conversation est identifiee.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error("Variable d'environnement manquante : DATABASE_URL");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.conversation.upsert({
      where: { id: CONVERSATION_ID },
      update: {},
      create: {
        id: CONVERSATION_ID,
        customerId: 'charlie',
        reservationRef: 'YCYW-2026-000042',
        topic: 'reservation',
        status: 'waiting',
        lastSeq: 1,
        messages: {
          create: {
            seq: 1,
            authorType: 'customer',
            authorId: 'charlie',
            body: 'Bonjour, puis-je encore modifier la date de retour de ma reservation ?',
          },
        },
      },
    });
    const messages = await prisma.message.count();
    console.log(`Jeu de donnees en place : ${messages} message(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
