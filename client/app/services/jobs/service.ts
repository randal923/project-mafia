import type { User } from "firebase/auth";
import type {
  Job,
  JobStoryChoice,
  JobStoryScene,
  JobStorySeed,
  JobType,
} from "../../models/job";
import type { Player, PlayerRank } from "../../models/player";
import { calculatePlayerPower } from "../../player/lib/calculatePlayerPower";
import { AppErrorHandler } from "../errors";
import { JobCalculatorService } from "./calculator";
import type {
  JobGenerationContext,
  JobIntroResponse,
  JobIntroResult,
  JobChoiceResponse,
  JobChoiceResult,
  JobsResponse,
  JobsServiceResult,
  RankProfile,
} from "./types";

const rankProfiles: Record<PlayerRank, RankProfile> = {
  city_kingpin: { tier: 6 },
  crime_lord: { tier: 5 },
  crew_leader: { tier: 2 },
  district_boss: { tier: 4 },
  local_boss: { tier: 3 },
  nobody: { tier: 0 },
  street_hustler: { tier: 1 },
};

const starterDocksRobberyStorySeed: JobStorySeed = {
  location: "Pier 17 service lane",
  premise:
    "Lift a dockside collections pouch before it reaches the Dock Rats counting room.",
  pressure:
    "A tired lookout watches the alley while a union clerk closes the night books.",
};

export class JobsService {
  static createJobsForPlayer(player: Player): Job[] {
    const context = JobsService.createGenerationContext(player);

    return [
      JobsService.createRobbery(
        context,
        "robbery",
        starterDocksRobberyStorySeed,
      ),
    ];
  }

  static async getJobs(user: User): Promise<JobsServiceResult> {
    try {
      const payload = await JobsService.postAuthenticated<JobsResponse>(
        user,
        "/api/jobs",
        {},
        "Jobs could not be loaded.",
      );

      return {
        jobs: payload.jobs,
        ok: true,
      };
    } catch (error) {
      return {
        error: AppErrorHandler.toResult(error, "Jobs could not be loaded."),
        ok: false,
      };
    }
  }

  static async createJobIntro(
    user: User,
    jobId: string,
  ): Promise<JobIntroResult> {
    try {
      const payload = await JobsService.postAuthenticated<JobIntroResponse>(
        user,
        "/api/jobs/story",
        {
          jobId,
          phase: "intro",
        },
        "Job story could not be started.",
      );

      return {
        ok: true,
        story: payload.story,
      };
    } catch (error) {
      return {
        error: AppErrorHandler.toResult(
          error,
          "Job story could not be started.",
        ),
        ok: false,
      };
    }
  }

  static async resolveJobChoice(
    user: User,
    jobId: string,
    story: JobStoryScene,
    choicePath: JobStoryChoice[],
    choice: JobStoryChoice,
  ): Promise<JobChoiceResult> {
    try {
      const payload = await JobsService.postAuthenticated<JobChoiceResponse>(
        user,
        "/api/jobs/story",
        {
          choice,
          choicePath,
          jobId,
          phase: "choice",
          story,
        },
        "Job choice could not be resolved.",
      );

      return {
        ok: true,
        resolution: payload.resolution,
      };
    } catch (error) {
      return {
        error: AppErrorHandler.toResult(
          error,
          "Job choice could not be resolved.",
        ),
        ok: false,
      };
    }
  }

  private static createGenerationContext(
    player: Player,
  ): JobGenerationContext {
    const rankTier = rankProfiles[player.rank].tier;

    return {
      effectivePower: calculatePlayerPower(player),
      heat: player.resources.heat,
      rank: player.rank,
      rankTier,
    };
  }

  private static createRobbery(
    context: JobGenerationContext,
    type: JobType,
    storySeed: JobStorySeed,
  ): Job {
    const calculations = JobCalculatorService.calculateRobbery(context);

    return {
      difficulty: calculations.difficulty,
      district: "Docks",
      factionImpact: {
        respectChange: calculations.factionRespectChange,
        targetFaction: "Dock Rats",
      },
      heatIncrease: calculations.heatIncrease,
      id: `robbery-docks-r${context.rankTier}-p${context.effectivePower}`,
      requiredCrew: calculations.requiredCrew,
      rewardMax: calculations.rewardMax,
      rewardMin: calculations.rewardMin,
      risk: calculations.risk,
      storySeed,
      type,
    };
  }

  private static async postAuthenticated<TPayload>(
    user: User,
    url: string,
    body: unknown,
    fallbackMessage: string,
  ): Promise<TPayload> {
    const idToken = await user.getIdToken();
    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw await AppErrorHandler.createAPIError(response, fallbackMessage);
    }

    return (await response.json()) as TPayload;
  }
}
