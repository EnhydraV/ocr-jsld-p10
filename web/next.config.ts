import type { NextConfig } from 'next';

const config: NextConfig = {
  // Le depot porte deux projets npm : sans cela, Next remonte a la racine pour tracer ses
  // fichiers et previent qu'il a peut-etre mal devine.
  outputFileTracingRoot: __dirname,
  // Le cache de build vit dans node_modules, sur le volume ext4 : sur un projet monte
  // depuis Windows, l'ecriture dans .next echoue.
  distDir: 'node_modules/.next',
};

export default config;
