import 'reflect-metadata';
import { AppDataSource } from '@database/data-source';
import { createApp } from './app';
import { getEnvConfig } from '@config/env.config';

async function bootstrap(): Promise<void> {
  const env = getEnvConfig();
  const app = createApp();

  await AppDataSource.initialize();

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
