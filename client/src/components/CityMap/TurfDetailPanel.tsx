"use client";

import {
  MAX_BUILDING_LEVEL,
  buildingRepairCost,
  buildingUpgradeCost,
} from "@shared/building";
import { buildingDefinition, buildingsOfClass } from "@shared/buildingCatalog";
import { attackStake } from "@shared/battle";
import { CREW_ARCHETYPES, type CrewMember } from "@shared/crew";
import { DISTRICTS } from "@shared/district";
import { PLAYER_RANKS, type Player } from "@shared/player";
import { turfDefense, type TurfState } from "@shared/territory";
import { useState } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Button } from "../Button/Button";
import { Tag } from "../Tag/Tag";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

type TurfDetailPanelProps = {
  crew: CrewMember[];
  isBusy: boolean;
  onAttack: () => void;
  onBuild: (definitionId: string) => void;
  onClaim: () => void;
  onDefend: () => void;
  onRepairBuilding: (buildingId: string) => void;
  onStaffBuilding: (buildingId: string, crewIds: string[]) => void;
  onUpgradeBuilding: (buildingId: string) => void;
  player: Player;
  turf: TurfState;
};

export function TurfDetailPanel({
  crew,
  isBusy,
  onAttack,
  onBuild,
  onClaim,
  onDefend,
  onRepairBuilding,
  onStaffBuilding,
  onUpgradeBuilding,
  player,
  turf,
}: TurfDetailPanelProps) {
  const [buildSelection, setBuildSelection] = useState("");
  const [staffingBuildingId, setStaffingBuildingId] = useState<string | null>(
    null,
  );
  const [now] = useState(() => Date.now());

  const isOwn = turf.ownerUid === player.id;
  const isNeutral = turf.ownerUid === null;
  const landmark = turf.landmarkId
    ? buildingDefinition(turf.landmarkId)
    : null;
  const shieldMs = turf.shieldUntil ? Date.parse(turf.shieldUntil) : 0;
  const shielded = shieldMs > now;
  const defenderNames = turf.assignedCrew
    .map((id) => crew.find((member) => member.id === id)?.name)
    .filter(Boolean);
  const visibleDefense = turfDefense(turf, 0);
  const rackets = buildingsOfClass("racket").filter(
    (def) =>
      PLAYER_RANKS.indexOf(player.rank) >=
      PLAYER_RANKS.indexOf(def.rankRequirement),
  );
  const idleCrew = crew.filter((member) => member.status === "idle");

  return (
    <aside className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <header>
        <p className={`m-0 ${typography.metadata}`}>
          {DISTRICTS[turf.district].label}
        </p>
        <h2 className={`m-0 ${displayText} text-3xl text-title`}>
          {turf.name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {landmark ? (
            <Tag className="border-brass text-brass" label={`★ ${landmark.name}`} />
          ) : null}
          {shielded ? (
            <Tag
              className="border-teal text-teal"
              label={`Shielded until ${new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(shieldMs)}`}
            />
          ) : null}
          {isNeutral ? (
            <Tag label={landmark ? "NPC garrison" : "Unclaimed"} />
          ) : (
            <Tag
              className={isOwn ? "border-brass text-brass" : "border-danger text-danger-strong"}
              label={isOwn ? "Your flag" : `${turf.ownerName}'s flag`}
            />
          )}
        </div>
      </header>

      {landmark ? (
        <p className={`m-0 ${typography.narrativeCaption}`}>
          {landmark.description}
        </p>
      ) : null}

      <dl className="m-0 grid grid-cols-3 gap-2 text-center">
        {[
          ["Defense", `${visibleDefense}+`],
          ["Slots", `${turf.buildings.length}/${turf.buildingSlots}`],
          [
            "Income/hr",
            moneyFormatter.format(DISTRICTS[turf.district].turfIncomePerHour),
          ],
        ].map(([label, value]) => (
          <div
            className="rounded-control border border-line bg-black/20 px-2 py-2"
            key={label}
          >
            <dt className={typography.metadata}>{label}</dt>
            <dd className={`m-0 ${displayText} text-lg text-brass-bright`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* ---- actions on someone else's ground ---- */}
      {!isOwn && (
        <div className="flex flex-col gap-2">
          {isNeutral && !landmark ? (
            <Button disabled={isBusy} onClick={onClaim} variant="primary">
              Move on this block
            </Button>
          ) : (
            <Button
              disabled={isBusy || shielded}
              onClick={onAttack}
              variant="danger"
            >
              {landmark && isNeutral ? "Storm the landmark" : "Attack"} (stake ~
              {moneyFormatter.format(attackStake(visibleDefense))})
            </Button>
          )}
          {isNeutral && !landmark ? (
            <p className={`m-0 ${typography.metadata}`}>
              A takeover plays out like a job — win it and the flag goes up.
            </p>
          ) : null}
        </div>
      )}

      {/* ---- own turf management ---- */}
      {isOwn && (
        <>
          <div>
            <p className={`m-0 ${typography.metadata}`}>
              Defenders ({turf.assignedCrew.length})
            </p>
            <p className={`m-0 ${typography.paragraph}`}>
              {defenderNames.length > 0
                ? defenderNames.join(", ")
                : "Nobody standing guard."}
            </p>
            <Button
              className="mt-2"
              disabled={isBusy}
              onClick={onDefend}
              size="small"
              variant="secondary"
            >
              Post defenders
            </Button>
          </div>

          {turf.buildings.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className={`m-0 ${typography.metadata}`}>Rackets here</p>
              {turf.buildings.map((building) => {
                const definition = buildingDefinition(building.definitionId);
                if (!definition) {
                  return null;
                }
                const upgradeCost = buildingUpgradeCost(
                  definition,
                  building.level + 1,
                );
                const repairCost = buildingRepairCost(
                  definition,
                  building.level,
                );
                return (
                  <div
                    className="rounded-control border border-line bg-black/20 p-3"
                    key={building.id}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`${displayText} text-lg text-title`}>
                        {definition.name} · L{building.level}
                      </span>
                      {building.damaged ? (
                        <Tag
                          className="border-danger text-danger-strong"
                          label="Closed"
                        />
                      ) : (
                        <span className={typography.metadata}>
                          till {moneyFormatter.format(Math.floor(building.storedIncome))}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {building.damaged ? (
                        <Button
                          disabled={isBusy || player.resources.cash < repairCost}
                          onClick={() => onRepairBuilding(building.id)}
                          size="small"
                          variant="primary"
                        >
                          Repair ({moneyFormatter.format(repairCost)})
                        </Button>
                      ) : (
                        <>
                          {building.level < MAX_BUILDING_LEVEL ? (
                            <Button
                              disabled={
                                isBusy || player.resources.cash < upgradeCost
                              }
                              onClick={() => onUpgradeBuilding(building.id)}
                              size="small"
                              variant="secondary"
                            >
                              Upgrade ({moneyFormatter.format(upgradeCost)})
                            </Button>
                          ) : null}
                          {staffingBuildingId === building.id ? (
                            <select
                              aria-label="Assign staff"
                              className="rounded-control border border-line bg-black/30 px-2 py-1 text-ink"
                              onChange={(event) => {
                                setStaffingBuildingId(null);
                                if (event.target.value) {
                                  onStaffBuilding(building.id, [
                                    event.target.value,
                                  ]);
                                }
                              }}
                              value=""
                            >
                              <option value="">Pick a worker…</option>
                              <option value="">(clear staff)</option>
                              {idleCrew.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name} (
                                  {CREW_ARCHETYPES[member.archetype].label})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Button
                              disabled={isBusy}
                              onClick={() => setStaffingBuildingId(building.id)}
                              size="small"
                              variant="quiet"
                            >
                              Staff ({building.staff.length}/
                              {definition.staffSlots})
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {turf.buildings.length < turf.buildingSlots ? (
            <div className="flex flex-col gap-2">
              <p className={`m-0 ${typography.metadata}`}>Build a racket</p>
              <select
                aria-label="Racket to build"
                className="rounded-control border border-line bg-black/30 px-2 py-2 text-ink"
                onChange={(event) => setBuildSelection(event.target.value)}
                value={buildSelection}
              >
                <option value="">Choose…</option>
                {rackets.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name} — {moneyFormatter.format(def.cost)} (
                    {moneyFormatter.format(def.incomePerHour)}/hr)
                  </option>
                ))}
              </select>
              <Button
                disabled={
                  isBusy ||
                  !buildSelection ||
                  player.resources.cash <
                    (buildingDefinition(buildSelection)?.cost ?? Infinity)
                }
                onClick={() => {
                  onBuild(buildSelection);
                  setBuildSelection("");
                }}
                size="small"
                variant="primary"
              >
                Break ground
              </Button>
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}
