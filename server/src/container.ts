import { AppRoute } from './app';
import { EnvConfig } from './config/env';
import { CrewController } from './controllers/CrewController';
import { EmpireController } from './controllers/EmpireController';
import { HealthController } from './controllers/HealthController';
import { MapController } from './controllers/MapController';
import { JobsController } from './controllers/JobsController';
import { NotificationsController } from './controllers/NotificationsController';
import { PlayerController } from './controllers/PlayerController';
import { PrisonController } from './controllers/PrisonController';
import { SeasonController } from './controllers/SeasonController';
import { StoreController } from './controllers/StoreController';
import { TickController } from './controllers/TickController';
import { AuthMiddleware } from './middleware/authenticate';
import { ErrorHandler } from './middleware/errorHandler';
import { AiNarratorService } from './services/ai/AiNarratorService';
import { MissionNarrator } from './services/ai/MissionNarrator';
import { OpenAiProviderService } from './services/ai/OpenAiProviderService';
import { AttackService } from './services/AttackService';
import { BuildingService } from './services/BuildingService';
import { CrewService } from './services/CrewService';
import { EffectsService } from './services/EffectsService';
import { EngineConfigService } from './services/EngineConfigService';
import { EquipmentService } from './services/EquipmentService';
import { FirebaseService } from './services/FirebaseService';
import { JobBoardService } from './services/JobBoardService';
import { LoadoutService } from './services/LoadoutService';
import { MissionService } from './services/MissionService';
import { MissionTemplateService } from './services/MissionTemplateService';
import { NewspaperService } from './services/NewspaperService';
import { NotificationService } from './services/NotificationService';
import { PlayerService } from './services/PlayerService';
import { PrisonService } from './services/PrisonService';
import { RecruitmentService } from './services/RecruitmentService';
import { SeasonService } from './services/SeasonService';
import { SeasonTickService } from './services/SeasonTickService';
import { StoreService } from './services/StoreService';
import { TerritoryService } from './services/TerritoryService';
import { WorldEventService } from './services/WorldEventService';

export class Container {
  readonly errorHandler: ErrorHandler;
  readonly firebase: FirebaseService;
  readonly missionTemplates: MissionTemplateService;
  readonly narrator: MissionNarrator;
  readonly routes: readonly AppRoute[];

  constructor(readonly config: EnvConfig) {
    this.firebase = new FirebaseService(config);
    const equipment = new EquipmentService(this.firebase);
    const aiProvider = new OpenAiProviderService(config);
    this.narrator = new AiNarratorService(aiProvider);
    this.missionTemplates = new MissionTemplateService();
    const engineConfig = new EngineConfigService();
    const notificationService = new NotificationService(this.firebase);
    const effectsService = new EffectsService(this.firebase);
    const crewService = new CrewService(
      this.firebase,
      notificationService,
      effectsService,
    );
    const recruitmentService = new RecruitmentService(
      this.firebase,
      crewService,
      aiProvider,
    );
    const buildingService = new BuildingService(this.firebase, effectsService);

    const playerService = new PlayerService(
      this.firebase,
      equipment,
      engineConfig,
      effectsService,
    );
    const loadoutService = new LoadoutService(this.firebase);
    const storeService = new StoreService(this.firebase, equipment, effectsService);
    const prisonService = new PrisonService(this.firebase, engineConfig);
    const jobBoardService = new JobBoardService(this.firebase, this.missionTemplates, engineConfig, aiProvider);
    const worldEventService = new WorldEventService(this.firebase);
    const seasonService = new SeasonService(this.firebase, effectsService);
    const newspaperService = new NewspaperService(
      this.firebase,
      worldEventService,
      aiProvider,
    );
    const missionService = new MissionService(
      this.firebase,
      jobBoardService,
      this.narrator,
      this.missionTemplates,
      engineConfig,
      prisonService,
      notificationService,
      worldEventService,
      seasonService,
      effectsService,
    );
    const territoryService = new TerritoryService(
      this.firebase,
      seasonService,
      missionService,
      buildingService,
      effectsService,
      this.missionTemplates,
      engineConfig,
      notificationService,
      worldEventService,
    );
    const attackService = new AttackService(
      this.firebase,
      seasonService,
      notificationService,
      worldEventService,
      effectsService,
      newspaperService,
    );
    const seasonTickService = new SeasonTickService(
      this.firebase,
      seasonService,
      newspaperService,
      worldEventService,
      notificationService,
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
      {
        handlers: [
          auth.authenticate,
          new CrewController(playerService, crewService, recruitmentService).router,
        ],
        path: '/crew',
      },
      {
        handlers: [
          auth.authenticate,
          new NotificationsController(notificationService).router,
        ],
        path: '/notifications',
      },
      {
        handlers: [
          auth.authenticate,
          new EmpireController(buildingService, territoryService).router,
        ],
        path: '/empire',
      },
      {
        handlers: [
          auth.authenticate,
          new MapController(playerService, territoryService, attackService).router,
        ],
        path: '/map',
      },
      {
        handlers: [
          auth.authenticate,
          new SeasonController(seasonService, newspaperService).router,
        ],
        path: '/season',
      },
      {
        handlers: [new TickController(config, seasonTickService).router],
        path: '/internal',
      },
    ];

    this.errorHandler = new ErrorHandler(config);
  }
}
