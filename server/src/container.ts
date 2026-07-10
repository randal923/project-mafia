import { AppRoute } from './app';
import { EnvConfig } from './config/env';
import { HealthController } from './controllers/HealthController';
import { JobsController } from './controllers/JobsController';
import { PlayerController } from './controllers/PlayerController';
import { PrisonController } from './controllers/PrisonController';
import { StoreController } from './controllers/StoreController';
import { AuthMiddleware } from './middleware/authenticate';
import { ErrorHandler } from './middleware/errorHandler';
import { AiNarratorService } from './services/ai/AiNarratorService';
import { MissionNarrator } from './services/ai/MissionNarrator';
import { OpenAiProviderService } from './services/ai/OpenAiProviderService';
import { EngineConfigService } from './services/EngineConfigService';
import { EquipmentService } from './services/EquipmentService';
import { FirebaseService } from './services/FirebaseService';
import { JobBoardService } from './services/JobBoardService';
import { LoadoutService } from './services/LoadoutService';
import { MissionService } from './services/MissionService';
import { MissionTemplateService } from './services/MissionTemplateService';
import { PlayerService } from './services/PlayerService';
import { PrisonService } from './services/PrisonService';
import { StoreService } from './services/StoreService';

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

    const playerService = new PlayerService(this.firebase, equipment, engineConfig);
    const loadoutService = new LoadoutService(this.firebase);
    const storeService = new StoreService(this.firebase, equipment);
    const prisonService = new PrisonService(this.firebase, engineConfig);
    const jobBoardService = new JobBoardService(this.firebase, this.missionTemplates, engineConfig);
    const missionService = new MissionService(
      this.firebase,
      jobBoardService,
      this.narrator,
      this.missionTemplates,
      engineConfig,
      prisonService,
    );

    const auth = new AuthMiddleware(this.firebase);

    this.routes = [
      { handlers: [new HealthController(this.firebase).router], path: '/' },
      {
        handlers: [
          auth.authenticate,
          new PlayerController(playerService, loadoutService).router,
        ],
        path: '/players',
      },
      {
        handlers: [
          auth.authenticate,
          new JobsController(playerService, jobBoardService, missionService).router,
        ],
        path: '/jobs',
      },
      {
        handlers: [auth.authenticate, new StoreController(storeService).router],
        path: '/store',
      },
      {
        handlers: [
          auth.authenticate,
          new PrisonController(playerService, prisonService).router,
        ],
        path: '/prison',
      },
    ];

    this.errorHandler = new ErrorHandler(config);
  }
}
