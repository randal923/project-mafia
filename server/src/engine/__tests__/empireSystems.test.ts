import { describe, expect, it } from "vitest";
import {
  BATTLE_TIER_BY_WINS,
  attackStake,
  clashWinChance,
  defenseDamageDealt,
} from "../../../../shared/battle";
import {
  INCOME_STORAGE_HOURS,
  accrueStoredIncome,
  buildingIncomeRate,
  buildingLevelIncomeFactor,
  buildingRepairCost,
  buildingStaffFactor,
  buildingTotalInvested,
  buildingUpgradeCost,
} from "../../../../shared/building";
import {
  BUILDING_CATALOG,
  buildingDefinition,
  buildingsOfClass,
} from "../../../../shared/buildingCatalog";
import { CITY_TURFS } from "../../../../shared/cityMap";
import {
  CREW_ARCHETYPE_IDS,
  CREW_ARCHETYPES,
  CREW_TIERS,
  candidateTierWeights,
  crewCheckBonus,
  crewHireCost,
  crewJobCapacity,
  crewMemberPower,
  crewWage,
} from "../../../../shared/crew";
import { DISTRICT_IDS, DISTRICTS, districtIdForLabel } from "../../../../shared/district";
import {
  canReachTurf,
  controlsDistrictMajority,
  turfDefense,
  turfUpkeepPerDay,
  turfsAdjacent,
} from "../../../../shared/territory";

describe("crew economy", () => {
  it("maps every archetype to a distinct skill", () => {
    const skills = CREW_ARCHETYPE_IDS.map((id) => CREW_ARCHETYPES[id].skill);
    expect(new Set(skills).size).toBe(CREW_ARCHETYPE_IDS.length);
  });

  it("prices wages up the tier ladder", () => {
    const wages = CREW_TIERS.map((tier) => crewWage(tier, 50, []));
    for (let i = 1; i < wages.length; i += 1) {
      expect(wages[i]!).toBeGreaterThan(wages[i - 1]!);
    }
  });

  it("keeps a mid-tier soldier affordable on early-mission income", () => {
    // A soldier (tier 2) at skill 15 should cost less to hire than ~8
    // early-mid missions (~$400 each) and his daily wage under one job.
    expect(crewHireCost(2, 15, [])).toBeLessThan(3200);
    expect(crewWage(2, 15, [])).toBeLessThan(400);
  });

  it("greedy legends are a real payroll line", () => {
    expect(crewWage(5, 90, ["greedy"])).toBeGreaterThan(1000);
  });

  it("check bonuses stay modest relative to the 75-point base chance", () => {
    expect(crewCheckBonus({ skillLevel: 100, tier: 5, traits: [] })).toBeLessThanOrEqual(16);
    expect(
      crewCheckBonus({ skillLevel: 1, tier: 1, traits: ["coward"] }),
    ).toBeGreaterThanOrEqual(1);
  });

  it("leadership widens the job crew from 1 to 5 across the skill range", () => {
    expect(crewJobCapacity(1)).toBe(1);
    expect(crewJobCapacity(100)).toBe(5);
  });

  it("gear on a member's back raises his fighting power", () => {
    const bare = crewMemberPower({
      loadout: {},
      skillLevel: 40,
      tier: 3,
      traits: [],
    });
    const armed = crewMemberPower({
      loadout: { hand: { id: "x", name: "Piece", power: 12 } },
      skillLevel: 40,
      tier: 3,
      traits: [],
    });
    expect(armed).toBe(bare + 12);
  });

  it("never offers legends to a street-level player", () => {
    const weights = candidateTierWeights(10);
    expect(weights[4]).toBe(0);
    expect(weights[5]).toBe(0);
  });
});

describe("building economy", () => {
  it("keeps the catalog internally consistent", () => {
    const ids = new Set(BUILDING_CATALOG.map((def) => def.id));
    expect(ids.size).toBe(BUILDING_CATALOG.length);
    // Exactly one landmark per district.
    const landmarks = buildingsOfClass("landmark");
    expect(landmarks.map((def) => def.district).sort()).toEqual(
      [...DISTRICT_IDS].sort(),
    );
    // Fronts cool you down; rackets run hot.
    for (const def of buildingsOfClass("racket")) {
      expect(def.heatPerDay, def.id).toBeGreaterThan(0);
    }
  });

  it("pays back a first front in under four days of capped play", () => {
    const laundromat = buildingDefinition("laundromat")!;
    const hoursToPayback = laundromat.cost / laundromat.incomePerHour;
    expect(hoursToPayback).toBeLessThan(96);
    expect(hoursToPayback).toBeGreaterThan(24);
  });

  it("keeps passive income below active mission income at level", () => {
    // Endgame casino at level 1, staffed: 5000/hr. An endgame mission run
    // (~10 minutes of play) pays ~7-10k — active play stays king.
    const casino = buildingDefinition("casino")!;
    expect(casino.incomePerHour).toBeLessThan(7000);
  });

  it("scales income and cost with level", () => {
    expect(buildingLevelIncomeFactor(5)).toBeCloseTo(3.4);
    const speakeasy = buildingDefinition("speakeasy")!;
    expect(buildingUpgradeCost(speakeasy, 2)).toBeGreaterThan(0);
    expect(buildingTotalInvested(speakeasy, 5)).toBeGreaterThan(
      speakeasy.cost * 3,
    );
    // Repairing a captured building costs a third-ish of what it's worth.
    expect(buildingRepairCost(speakeasy, 5)).toBeLessThan(
      buildingTotalInvested(speakeasy, 5) / 2,
    );
  });

  it("staffing multiplies output: unstaffed 40%, matched archetype 100%", () => {
    const club = buildingDefinition("strip-club")!;
    expect(buildingStaffFactor(club, [])).toBeCloseTo(0.4);
    expect(
      buildingStaffFactor(club, [
        { archetype: "face", incomeFactor: 1 },
        { archetype: "face", incomeFactor: 1 },
      ]),
    ).toBeCloseTo(1);
    expect(
      buildingStaffFactor(club, [{ archetype: "enforcer", incomeFactor: 1 }]),
    ).toBeLessThan(
      buildingStaffFactor(club, [{ archetype: "face", incomeFactor: 1 }]),
    );
  });

  it("caps the till at the storage window", () => {
    const stored = accrueStoredIncome(
      0,
      100,
      "2026-07-10T00:00:00.000Z",
      "2026-07-12T00:00:00.000Z", // 48h elapsed
    );
    expect(stored).toBe(100 * INCOME_STORAGE_HOURS);
  });

  it("damaged buildings produce nothing", () => {
    const club = buildingDefinition("strip-club")!;
    expect(buildingIncomeRate(club, 3, [], true)).toBe(0);
  });
});

describe("the city map", () => {
  it("lays out 70 turfs, 10 per district, with one landmark each", () => {
    expect(CITY_TURFS).toHaveLength(70);
    for (const district of DISTRICT_IDS) {
      const turfs = CITY_TURFS.filter((turf) => turf.district === district);
      expect(turfs, district).toHaveLength(10);
      expect(turfs.filter((turf) => turf.landmarkId).length, district).toBe(1);
    }
    // Landmark turfs carry no racket slots; the landmark IS the building.
    for (const turf of CITY_TURFS.filter((t) => t.landmarkId)) {
      expect(turf.buildingSlots).toBe(0);
      expect(buildingDefinition(turf.landmarkId!)).not.toBeNull();
    }
    // Unique coordinates on the 10x7 grid.
    const cells = new Set(CITY_TURFS.map((turf) => `${turf.x},${turf.y}`));
    expect(cells.size).toBe(70);
  });

  it("every mission district label resolves to a map district", () => {
    for (const district of DISTRICT_IDS) {
      expect(districtIdForLabel(DISTRICTS[district].label)).toBe(district);
    }
  });

  it("adjacency is orthogonal and reach covers the home district", () => {
    const [a, b] = CITY_TURFS;
    expect(turfsAdjacent(a!, { x: a!.x + 1, y: a!.y })).toBe(true);
    expect(turfsAdjacent(a!, { x: a!.x + 1, y: a!.y + 1 })).toBe(false);
    // A foothold anywhere in a district reaches the whole district.
    const sameDistrict = CITY_TURFS.filter(
      (turf) => turf.district === a!.district,
    );
    expect(canReachTurf(sameDistrict[9]!, [a!])).toBe(true);
    void b;
  });
});

describe("territory pressure", () => {
  it("upkeep grows superlinearly — empires bleed", () => {
    const ten = turfUpkeepPerDay(10);
    const seventy = turfUpkeepPerDay(70);
    expect(seventy).toBeGreaterThan(ten * 7);

    // A ten-turf family lives comfortably on base turf income alone.
    const tenTurfIncome = 10 * 65;
    expect(ten).toBeLessThan(tenTurfIncome);

    // Full conquest is deliberately upkeep-heavy: base turf income alone
    // does NOT carry it (anti-snowball), but base + the seven captured
    // landmarks does — a conquest-scale empire runs on its crown jewels.
    const baseCityIncome = DISTRICT_IDS.reduce(
      (sum, district) => sum + 10 * DISTRICTS[district].turfIncomePerHour,
      0,
    );
    const landmarkIncome = buildingsOfClass("landmark").reduce(
      (sum, def) => sum + def.incomePerHour,
      0,
    );
    expect(seventy).toBeGreaterThan(baseCityIncome);
    expect(seventy).toBeLessThan(baseCityIncome + landmarkIncome);
  });

  it("majority control needs strictly more than half", () => {
    expect(controlsDistrictMajority(5, 10)).toBe(false);
    expect(controlsDistrictMajority(6, 10)).toBe(true);
  });

  it("posted crew and rackets harden a turf", () => {
    const bare = turfDefense(
      { baseDefense: 30, buildings: [], defenseDamage: 0 },
      0,
    );
    const held = turfDefense(
      {
        baseDefense: 30,
        buildings: [
          {
            createdAt: "",
            damaged: false,
            definitionId: "speakeasy",
            id: "b",
            incomeAccruedAt: "",
            level: 3,
            staff: [],
            storedIncome: 0,
            updatedAt: "",
          },
        ],
        defenseDamage: 0,
      },
      20,
    );
    expect(held).toBeGreaterThan(bare + 40);
  });
});

describe("battle math", () => {
  it("clash odds stay inside the 5-95 band and favor the bigger force", () => {
    expect(clashWinChance(1, 1000)).toBeGreaterThanOrEqual(5);
    expect(clashWinChance(1000, 1)).toBeLessThanOrEqual(95);
    expect(clashWinChance(200, 100)).toBeGreaterThan(clashWinChance(100, 200));
    // An even fight is a coin flip.
    expect(clashWinChance(100, 100)).toBe(50);
  });

  it("maps wins onto the outcome-tier vocabulary", () => {
    expect(BATTLE_TIER_BY_WINS[3]).toBe("jackpot");
    expect(BATTLE_TIER_BY_WINS[2]).toBe("successful");
    expect(BATTLE_TIER_BY_WINS[1]).toBe("partial_failure");
    expect(BATTLE_TIER_BY_WINS[0]).toBe("disaster");
  });

  it("stakes and damage scale with the defense being attacked", () => {
    expect(attackStake(100)).toBe(1000);
    expect(defenseDamageDealt(100)).toBeGreaterThanOrEqual(15);
    expect(defenseDamageDealt(10)).toBeGreaterThanOrEqual(3);
  });
});
