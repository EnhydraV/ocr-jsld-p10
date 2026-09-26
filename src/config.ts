// Configuration lue dans l'environnement. Aucune valeur secrete par defaut : une variable
// manquante arrete le service au demarrage plutot que de le laisser tourner a moitie.

export interface Config {
  port: number;
  instanceName: string;
  databaseUrl: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env['PORT'] ?? 3000),
    instanceName: env['INSTANCE_NAME'] ?? 'local',
    databaseUrl: required(env, 'DATABASE_URL'),
  };
}
