import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ChoiceEdge } from "../../../../shared/job";
import { SkillExperienceSettings } from "../../../../shared/missionTemplate";
import { createNewPlayer } from "../../../../shared/player";
import { EngineConfigService } from "../../services/EngineConfigService";
import { MissionTemplateService } from "../../services/MissionTemplateService";
import { MomentumService } from "../MomentumService";
import { SkillExperienceService } from "../SkillExperienceService";
import { TEST_ENGINE } from "./fixtures";

const NOW = "2026-07-09T12:00:00.000Z";

const settings: SkillExperienceSettings = {
  basePerSuccess: 2,
  criticalMultiplier: 2,
  perCheckDifficulty: 2,
};

function edgeWith(difficulty: number, roll: number, chance: number): ChoiceEdge {
  return {
    approach: "quiet",
    check: { difficulty, skill: "stealth" },
    gear: null,
    id: "0",
    intent: null,
    label: null,
    momentumDelta: 0,
    riskHint: null,
    roll: MomentumService.resolveCheck(roll, chance),
  };
}

describe("MissionTemplateService", () => {
  it("loads and validates every yml in the missions folder", () => {
    const service = new MissionTemplateService(
      join(process.cwd(), "missions"),
    );
    const templates = service.all();
    expect(templates.length).toBeGreaterThanOrEqual(1);
    // _engine.yml must not be treated as a mission template.
    expect(templates.every((t) => t.id !== undefined)).toBe(true);

    const docks = service.find("docks-robbery");
    expect(docks).not.toBeNull();
    expect(docks!.storySeeds.length).toBeGreaterThanOrEqual(3);
    expect(docks!.depth).toBeGreaterThanOrEqual(3);
  });
});

describe("EngineConfigService", () => {
  it("loads and validates _engine.yml", () => {
    const service = new EngineConfigService(
      join(process.cwd(), "missions", "_engine.yml"),
    );
    expect(service.config.board.size).toBeGreaterThanOrEqual(1);
    expect(service.config.checks.maxChance).toBeGreaterThan(
      service.config.checks.minChance,
    );
    expect(service.config.momentum.bolder.pass).toBeGreaterThan(
      service.config.momentum.safer.pass,
    );
  });
});

describe("SkillExperienceService", () => {
  it("previews normal and critical-success XP from one calculation", () => {
    expect(
      SkillExperienceService.previewForCheck(
        { difficulty: 3, skill: "stealth" },
        settings,
      ),
    ).toEqual({ criticalSuccess: 16, success: 8 });
  });

  it("awards nothing for a failed check", () => {
    expect(SkillExperienceService.xpForCheck(edgeWith(5, 90, 60), settings, TEST_ENGINE)).toBe(0);
  });

  it("scales XP with check difficulty", () => {
    // base 2 + 2 per difficulty point
    expect(SkillExperienceService.xpForCheck(edgeWith(1, 50, 60), settings, TEST_ENGINE)).toBe(4);
    expect(SkillExperienceService.xpForCheck(edgeWith(3, 50, 60), settings, TEST_ENGINE)).toBe(8);
    expect(SkillExperienceService.xpForCheck(edgeWith(10, 50, 60), settings, TEST_ENGINE)).toBe(22);
  });

  it("doubles XP on a critical pass", () => {
    // margin 50 >= CRITICAL_MARGIN
    expect(SkillExperienceService.xpForCheck(edgeWith(3, 10, 60), settings, TEST_ENGINE)).toBe(16);
  });

  it("groups exact selected-path gains and excludes failed checks", () => {
    const normalStealth = edgeWith(3, 50, 60);
    const criticalStealth = edgeWith(3, 10, 60);
    const failedMuscle: ChoiceEdge = {
      ...edgeWith(3, 90, 60),
      check: { difficulty: 3, skill: "muscle" },
    };
    const normalTech: ChoiceEdge = {
      ...edgeWith(1, 50, 60),
      check: { difficulty: 1, skill: "tech" },
    };

    expect(
      SkillExperienceService.summarize(
        [normalStealth, failedMuscle, criticalStealth, normalTech],
        settings,
        TEST_ENGINE,
      ),
    ).toEqual({ stealth: 24, tech: 4 });
  });

  it("applies XP to the checked skill only", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    const { player: updated, xpGained } = SkillExperienceService.applyToPlayer(
      player,
      edgeWith(3, 50, 60),
      settings,
      TEST_ENGINE,
      NOW,
    );

    expect(xpGained).toBe(8);
    expect(updated.progression.skillExperience.stealth).toBe(8);
    expect(updated.progression.skillExperience.muscle).toBe(0);
    expect(player.progression.skillExperience.stealth).toBe(0); // no mutation
  });

  it("returns the player unchanged on a fail", () => {
    const player = createNewPlayer("uid-1", "Test Player", NOW);
    const result = SkillExperienceService.applyToPlayer(
      player,
      edgeWith(3, 90, 60),
      settings,
      TEST_ENGINE,
      NOW,
    );
    expect(result.xpGained).toBe(0);
    expect(result.player).toBe(player);
  });
});
