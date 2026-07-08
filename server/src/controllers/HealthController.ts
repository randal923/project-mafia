import { Request, Response, Router } from 'express';
import { FirebaseService } from '../services/FirebaseService';

export class HealthController {
  readonly router: Router;

  constructor(private readonly firebase: FirebaseService) {
    this.router = Router();
    this.router.get('/health-check', this.check);
  }

  private check = async (_req: Request, res: Response): Promise<void> => {
    const firestoreOk = await this.firebase.ping();

    res.status(firestoreOk ? 200 : 503).json({
      status: firestoreOk ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      dependencies: {
        firestore: firestoreOk ? 'up' : 'down',
      },
    });
  };
}
