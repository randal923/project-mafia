import { App } from "./app";
import { EnvConfig } from "./config/env";
import { Container } from "./container";

async function bootstrap(): Promise<void> {
  const config = new EnvConfig();
  const container = new Container(config);

  console.log(`Mission narrator: OpenAI (${config.openAiModel})`);
  console.log(
    `Loaded ${container.missionTemplates.all().length} mission template(s): ${container.missionTemplates
      .all()
      .map((t) => t.id)
      .join(", ")}`,
  );

  const app = new App(config, container.routes, container.errorHandler);

  await app.start();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down…`);
    await app.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
