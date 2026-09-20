// Configuration Prisma 7 : l'URL de la base vit ici, plus dans le schéma. Les variables
// d'environnement ne sont pas chargées par Prisma : dotenv lit le fichier .env.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
