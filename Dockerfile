# Service de chat : compilation puis image d'execution sans outillage de developpement.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma.config.ts tsconfig.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src
# Le client Prisma est genere en TypeScript sous src, donc avant la compilation.
# prisma.config.ts exige DATABASE_URL a son chargement, meme pour generer : la valeur
# ci-dessous n'est jamais utilisee, aucune connexion n'est ouverte a ce stade.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
