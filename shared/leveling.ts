import {
  PLAYER_RANKS,
  PlayerRank,
  PlayerSkillExperience,
  PlayerSkills,
} from "./player";

/** Hard caps — the player level and every skill top out at 100. */
export const MAX_PLAYER_LEVEL = 100;
export const MAX_SKILL_LEVEL = 100;

/** Every skill level costs a flat 100 XP; the XP bar resets on level-up. */
export const SKILL_XP_PER_LEVEL = 100;

/**
 * XP needed to go from `level` to `level + 1`. Two pieces multiply:
 * missions at level L pay roughly (60 + 14L) XP on a success, and the
 * number of at-level missions a level should take grows from ~2 at the
 * start to ~8 near the cap — so level 100 is a long career, not a sprint.
 */
export function xpToNextLevel(level: number): number {
  const missionXp = 60 + 14 * level;
  const missionsNeeded = 2 + 4.5 * Math.pow(level / 100, 1.5);
  return 5 * Math.round((missionXp * missionsNeeded) / 5);
}

/** Rank is derived from level — climbing the ladder is automatic. */
export function rankForLevel(level: number): PlayerRank {
  if (level >= 85) return "city_kingpin";
  if (level >= 70) return "crime_lord";
  if (level >= 55) return "district_boss";
  if (level >= 40) return "local_boss";
  if (level >= 25) return "crew_leader";
  if (level >= 10) return "street_hustler";
  return PLAYER_RANKS[0];
}

export type PlayerLevelResult = {
  experience: number;
  level: number;
  levelsGained: number;
  rank: PlayerRank;
};

/**
 * Adds XP and cashes in as many level-ups as it buys. `experience` is
 * progress into the current level and resets each time, mirroring how
 * skill XP works.
 */
export function applyPlayerExperience(
  level: number,
  experience: number,
  gained: number,
): PlayerLevelResult {
  let newLevel = Math.min(level, MAX_PLAYER_LEVEL);
  let pool = experience + Math.max(0, gained);

  while (newLevel < MAX_PLAYER_LEVEL && pool >= xpToNextLevel(newLevel)) {
    pool -= xpToNextLevel(newLevel);
    newLevel += 1;
  }

  if (newLevel >= MAX_PLAYER_LEVEL) {
    pool = 0;
  }

  return {
    experience: pool,
    level: newLevel,
    levelsGained: newLevel - level,
    rank: rankForLevel(newLevel),
  };
}

export type SkillLevelResult = {
  levelsGained: number;
  skillExperience: PlayerSkillExperience;
  skills: PlayerSkills;
};

/**
 * Adds XP to one skill; every 100 XP converts to a skill level (overflow
 * carries into the next level) until the skill caps at 100.
 */
export function applySkillExperience(
  skills: PlayerSkills,
  skillExperience: PlayerSkillExperience,
  skill: keyof PlayerSkills,
  gained: number,
): SkillLevelResult {
  let level = skills[skill];
  let pool = skillExperience[skill] + Math.max(0, gained);
  const before = level;

  while (level < MAX_SKILL_LEVEL && pool >= SKILL_XP_PER_LEVEL) {
    pool -= SKILL_XP_PER_LEVEL;
    level += 1;
  }

  if (level >= MAX_SKILL_LEVEL) {
    pool = 0;
  }

  return {
    levelsGained: level - before,
    skillExperience: { ...skillExperience, [skill]: pool },
    skills: { ...skills, [skill]: level },
  };
}
