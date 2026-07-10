import { AppRoute } from './app';
import { EnvConfig } from './config/env';
import { HealthController } from './controllers/HealthController';
import { JobsController } from './controllers/JobsController';
import { PlayerController } from './controllers/PlayerController';
import { AuthMiddleware } from './middleware/authenticate';
import { ErrorHandler } from './middleware/errorHandler';
import { AiNarratorService } from './services/ai/AiNarratorService';
import { MissionNarrator } from './services/ai/MissionNarrator';
import { OpenAiProviderService } from './services/ai/OpenAiProviderService';
import { EngineConfigService } from './services/EngineConfigService';
import { EquipmentService } from './services/EquipmentService';
import { FirebaseService } from './services/FirebaseService';
import { JobBoardService } from './services/JobBoardService';
import { MissionService } from './services/MissionService';
import { MissionTemplateService } from './services/MissionTemplateService';
import { PlayerService } from './services/PlayerService';

export class Container {
  readonly errorHandler: ErrorHandler;
  readonly firebase: FirebaseService;
  readonly missionTemplates: MissionTemplateService;
  readonly narrator: MissionNarrator;
  readonly routes: readonly AppRoute[];

  constructor(readonly config: EnvConfig) {
    this.firebase = new FirebaseService(config);
    const equipment = new EquipmentService(this.firebase);
    this.narrator = new AiNarratorService(new OpenAiProviderService(config));
    this.missionTemplates = new MissionTemplateService();
    const engineConfig = new EngineConfigService();

    const playerService = new PlayerService(this.firebase, equipment);
    const jobBoardService = new JobBoardService(this.firebase, this.missionTemplates, engineConfig);
    const missionService = new MissionService(
      this.firebase,
      jobBoardService,
      this.narrator,
      this.missionTemplates,
      engineConfig,
    );

    const auth = new AuthMiddleware(this.firebase);

    this.routes = [
      { handlers: [new HealthController(this.firebase).router], path: '/' },
      {
        handlers: [auth.authenticate, new PlayerController(playerService).router],
        path: '/players',
      },
      {
        handlers: [
          auth.authenticate,
          new JobsController(playerService, jobBoardService, missionService).router,
        ],
        path: '/jobs',
      },
    ];

    this.errorHandler = new ErrorHandler(config);
  }
}
