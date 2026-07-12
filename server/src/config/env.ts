import dotenv from 'dotenv';

dotenv.config();

export class EnvConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly corsOrigin: string;
  readonly firebaseProjectId: string;
  readonly firebaseClientEmail: string;
  readonly firebasePrivateKey: string;
  readonly openAiApiKey: string;
  readonly openAiModel: string;
  readonly openAiApiUrl: string;
  /** Shared secret for the scheduled /internal/tick endpoint. */
  readonly cronSecret: string | null;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.nodeEnv = env.NODE_ENV ?? 'development';
    this.port = Number(env.PORT ?? 4000);
    this.corsOrigin = env.CORS_ORIGIN ?? 'http://localhost:3000';
    this.firebaseProjectId = this.requireVar(env, 'FIREBASE_PROJECT_ID');
    this.firebaseClientEmail = this.requireVar(env, 'FIREBASE_CLIENT_EMAIL');
    // .env stores the key with literal \n sequences; restore real newlines
    this.firebasePrivateKey = this.requireVar(env, 'FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
    this.openAiApiKey = this.requireVar(env, 'OPENAI_API_KEY');
    this.openAiModel = env.OPENAI_MODEL ?? 'gpt-5.4-mini';
    this.openAiApiUrl = env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
    this.cronSecret = env.CRON_SECRET ?? null;

    if (!Number.isInteger(this.port) || this.port <= 0) {
      throw new Error(`Invalid PORT value: ${env.PORT}`);
    }
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  private requireVar(env: NodeJS.ProcessEnv, name: string): string {
    const value = env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }
}
