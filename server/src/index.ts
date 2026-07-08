import { App } from './app';
import { EnvConfig } from './config/env';
import { FirebaseService } from './services/FirebaseService';

async function bootstrap(): Promise<void> {
  const config = new EnvConfig();
  const firebase = new FirebaseService(config);
  const app = new App(config, firebase);

  await app.start();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down…`);
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
