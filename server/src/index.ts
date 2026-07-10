import { App } from "./app";
import { EnvConfig } from "./config/env";
import { AiNarratorService } from "./services/ai/AiNarratorService";
import { FallbackNarratorService } from "./services/ai/FallbackNarratorService";
import { OpenAiProviderService } from "./services/ai/OpenAiProviderService";
import { EngineConfigService } from "./services/EngineConfigService";
import { EquipmentService } from "./services/EquipmentService";
import { FirebaseService } from "./services/FirebaseService";
import { MissionTemplateService } from "./services/MissionTemplateService";

async function bootstrap(): Promise<void> {
  const config = new EnvConfig();
  const firebase = new FirebaseService(config);
  const equipment = new EquipmentService(firebase);
  const narrator = config.aiEnabled
    ? new AiNarratorService(new OpenAiProviderService(config))
    : new FallbackNarratorService();
  console.log(
    config.aiEnabled
      ? `Mission narrator: OpenAI (${config.openAiModel})`
      : "Mission narrator: fallback text (AI disabled or no OPENAI_API_KEY)",
  );
  const missionTemplates = new MissionTemplateService();
  console.log(
    `Loaded ${missionTemplates.all().length} mission template(s): ${missionTemplates
      .all()
      .map((t) => t.id)
      .join(", ")}`,
  );
  const engineConfig = new EngineConfigService();
  const app = new App(config, firebase, equipment, narrator, missionTemplates, engineConfig);

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
