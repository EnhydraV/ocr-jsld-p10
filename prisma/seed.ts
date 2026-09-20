// Jeu de données de démonstration : une conversation ouverte par Charlie (client) au sujet
// d'une réservation, en attente d'un conseiller. Rejouable : la conversation est identifiée.
import 'dotenv/config';
import { createPrismaClient } from '../src/db/client.ts';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';

const prisma = createPrismaClient();
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
          body: 'Bonjour, puis-je encore modifier la date de retour de ma réservation ?',
        },
      },
    },
  });
  const messages = await prisma.message.count();
  console.log(`Jeu de données en place : ${messages} message(s).`);
} finally {
  await prisma.$disconnect();
}
