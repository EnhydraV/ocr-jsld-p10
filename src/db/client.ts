// Client Prisma partagé : un pool pg par processus, passé à Prisma par l'adaptateur.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.ts';

export function createPrismaClient(connectionString = process.env['DATABASE_URL']): PrismaClient {
  if (!connectionString) throw new Error("Variable d'environnement manquante : DATABASE_URL");
  const adapter = new PrismaPg({ connectionString, max: 10 });
  return new PrismaClient({ adapter });
}
