# Client web. L'adresse de la passerelle est inscrite dans le bundle a la compilation : elle
# doit etre joignable depuis le NAVIGATEUR, pas depuis le reseau des conteneurs.
FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_CHAT_URL=ws://localhost:3000
ENV NEXT_PUBLIC_CHAT_URL=$NEXT_PUBLIC_CHAT_URL
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3100
CMD ["npm", "run", "start"]
