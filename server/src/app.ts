import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import http from 'node:http';
import { EnvConfig } from './config/env';
import { HealthController } from './controllers/HealthController';
import { ErrorHandler } from './middleware/errorHandler';
import { FirebaseService } from './services/FirebaseService';

export class App {
  readonly express: Express;
  private server?: http.Server;

  constructor(
    private readonly config: EnvConfig,
    firebase: FirebaseService,
  ) {
    this.express = express();
    this.express.use(helmet());
    this.express.use(cors({ origin: config.corsOrigin }));
    this.express.use(express.json());

    this.express.use(new HealthController(firebase).router);

    const errorHandler = new ErrorHandler(config);
    this.express.use(errorHandler.notFound);
    this.express.use(errorHandler.handle);
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.express.listen(this.config.port, () => {
        console.log(`Server listening on http://localhost:${this.config.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}
