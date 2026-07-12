"use client";

import {
  INCOME_STORAGE_HOURS,
  MAX_BUILDING_LEVEL,
  PERSONAL_BUILDING_SLOTS_BY_RANK,
  buildingRepairCost,
  buildingUpgradeCost,
  type BuildingDefinition,
  type BuildingInstance,
} from "@shared/building";
import { buildingDefinition, buildingsOfClass } from "@shared/buildingCatalog";
import { CREW_ARCHETYPES, type CrewMember } from "@shared/crew";
import { PLAYER_RANKS } from "@shared/player";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { Tag } from "../../components/Tag/Tag";
import { Toast } from "../../components/Toast/Toast";
import { displayText, typography } from "../../design-system/typography";
import {
  ApiError,
  buyPersonalBuilding,
  collectAllIncome,
  fetchCrewRoster,
  fetchHoldings,
  repairPersonalBuilding,
  staffPersonalBuilding,
  upgradePersonalBuilding,
  type HoldingsResponse,
} from "../../lib/api";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

type EmpireToast = {
  message: string;
  title: string;
  tone: "failure" | "success";
};

type Holding = BuildingInstance & { incomeRate: number };

export function EmpirePageContent() {
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<EmpireToast | null>(null);
  const [staffingId, setStaffingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    let isCancelled = false;
    fetchHoldings(user)
      .then((result) => {
        if (!isCancelled) {
          setHoldings(result.buildings);
          setPlayer(result.player);
        }
      })
      .catch(() => undefined);
    fetchCrewRoster(user)
      .then((result) => {
        if (!isCancelled) {
          setCrew(result.crew);
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const applyResult = useCallback(
    (result: HoldingsResponse) => {
      setHoldings(result.buildings);
      setPlayer(result.player);
    },
    [setPlayer],
  );

  const runAction = useCallback(
    async (
      action: () => Promise<HoldingsResponse>,
      successTitle: string,
      successMessage: string,
    ) => {
      if (!user || isBusy) {
        return;
      }
      setIsBusy(true);
      try {
        applyResult(await action());
        setToast({
          message: successMessage,
          title: successTitle,
          tone: "success",
        });
      } catch (error) {
        setToast({
          message:
            error instanceof ApiError
              ? error.message
              : "That didn't work. Try again.",
          title: "No deal",
          tone: "failure",
        });
      } finally {
        setIsBusy(false);
      }
    },
    [applyResult, isBusy, user],
  );

  const catalog = useMemo(() => buildingsOfClass("personal"), []);
  const idleCrew = useMemo(
    () => crew.filter((member) => member.status === "idle"),
    [crew],
  );

  if (status === "loading" || status === "missing" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Opening the books…</p>
      </div>
    );
  }

  const slots = PERSONAL_BUILDING_SLOTS_BY_RANK[player.rank];
  const ownedDefinitionIds = new Set(
    (holdings ?? []).map((h) => h.definitionId),
  );

  const handleCollect = () =>
    void (async () => {
      if (!user || isBusy) {
        return;
      }
      setIsBusy(true);
      try {
        const result = await collectAllIncome(user);
        applyResult(result);
        setToast({
          message: result.raided
            ? `You banked ${moneyFormatter.format(result.collected)} — but the police raided your ${result.raided}. Repair it to reopen.`
            : `${moneyFormatter.format(result.collected)} banked${result.upkeep > 0 ? ` after ${moneyFormatter.format(result.upkeep)} in territory upkeep` : ""}.`,
          title: result.raided ? "Raided" : "Tills emptied",
          tone: result.raided ? "failure" : "success",
        });
      } catch (error) {
        setToast({
          message:
            error instanceof ApiError ? error.message : "Collection failed.",
          title: "No deal",
          tone: "failure",
        });
      } finally {
        setIsBusy(false);
      }
    })();

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-panel border border-line bg-surface px-6 py-5 shadow-panel">
        <div>
          <p className={`m-0 ${displayText} text-xl text-faint`}>
            Personal holdings
          </p>
          <h1 className={`mt-1 mb-0 ${displayText} text-5xl text-title`}>
            Empire
          </h1>
          <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
            Fronts and safe property — nobody can take these from you. The big
            rackets get built on turf, from the Map.
          </p>
        </div>
        <div className="flex items-end gap-6">
          <dl className="m-0 flex gap-8 text-right">
            <div>
              <dt className={typography.metadata}>Holdings</dt>
              <dd className={`m-0 ${displayText} text-3xl text-brass-bright`}>
                {holdings?.length ?? "—"}/{slots}
              </dd>
            </div>
            <div>
              <dt className={typography.metadata}>Your cash</dt>
              <dd className={`m-0 ${displayText} text-3xl text-profit`}>
                {moneyFormatter.format(player.resources.cash)}
              </dd>
            </div>
          </dl>
          <Button disabled={isBusy} onClick={handleCollect} variant="primary">
            Collect everything
          </Button>
        </div>
      </header>

      <section>
        <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>Your property</h2>
        {!holdings ? (
          <p className={typography.metadata}>Counting the tills…</p>
        ) : holdings.length === 0 ? (
          <p className={typography.metadata}>
            You own nothing yet. Every empire starts with one clean storefront.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {holdings.map((holding) => {
              const definition = buildingDefinition(holding.definitionId);
              if (!definition) {
                return null;
              }
              return (
                <HoldingCard
                  crew={crew}
                  definition={definition}
                  holding={holding}
                  idleCrew={idleCrew}
                  isBusy={isBusy}
                  isStaffing={staffingId === holding.id}
                  key={holding.id}
                  onRepair={() =>
                    void runAction(
                      () => repairPersonalBuilding(user!, holding.id),
                      "Back in business",
                      `${definition.name} is producing again.`,
                    )
                  }
                  onStaff={(crewIds) => {
                    setStaffingId(null);
                    void runAction(
                      () => staffPersonalBuilding(user!, holding.id, crewIds),
                      "Shift assigned",
                      `${definition.name} staffing updated.`,
                    );
                  }}
                  onToggleStaffing={() =>
                    setStaffingId((current) =>
                      current === holding.id ? null : holding.id,
                    )
                  }
                  onUpgrade={() =>
                    void runAction(
                      () => upgradePersonalBuilding(user!, holding.id),
                      "Expanded",
                      `${definition.name} is now level ${holding.level + 1}.`,
                    )
                  }
                  playerCash={player.resources.cash}
                />
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>
          On the market
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((definition) => {
            const rankMet =
              PLAYER_RANKS.indexOf(player.rank) >=
              PLAYER_RANKS.indexOf(definition.rankRequirement);
            const owned = ownedDefinitionIds.has(definition.id);
            return (
              <article
                className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 shadow-panel"
                key={definition.id}
              >
                <header className="flex items-start justify-between gap-2">
                  <p className={`m-0 ${displayText} text-2xl text-title`}>
                    {definition.name}
                  </p>
                  {owned ? <Tag className="border-brass text-brass" label="Owned" /> : null}
                </header>
                <p className={`m-0 ${typography.narrativeCaption}`}>
                  {definition.description}
                </p>
                <dl className="m-0 flex gap-6">
                  <div>
                    <dt className={typography.metadata}>Income/hr</dt>
                    <dd className={`m-0 ${displayText} text-lg text-profit`}>
                      {moneyFormatter.format(definition.incomePerHour)}
                    </dd>
                  </div>
                  <div>
                    <dt className={typography.metadata}>Heat/day</dt>
                    <dd
                      className={`m-0 ${displayText} text-lg ${definition.heatPerDay <= 0 ? "text-teal" : "text-danger-strong"}`}
                    >
                      {definition.heatPerDay > 0 ? "+" : ""}
                      {definition.heatPerDay}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto">
                  <Button
                    disabled={
                      isBusy ||
                      owned ||
                      !rankMet ||
                      (holdings?.length ?? 0) >= slots ||
                      player.resources.cash < definition.cost
                    }
                    onClick={() =>
                      void runAction(
                        () => buyPersonalBuilding(user!, definition.id),
                        "Deed signed",
                        `${definition.name} is yours. Staff it and let it earn.`,
                      )
                    }
                    size="small"
                    variant="primary"
                  >
                    {rankMet
                      ? `Buy (${moneyFormatter.format(definition.cost)})`
                      : `Requires ${definition.rankRequirement.replace(/_/g, " ")}`}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {toast ? (
        <div className="fixed right-6 bottom-6 z-20">
          <Toast
            message={toast.message}
            onDismiss={() => setToast(null)}
            title={toast.title}
            tone={toast.tone}
          />
        </div>
      ) : null}
    </div>
  );
}

type HoldingCardProps = {
  crew: CrewMember[];
  definition: BuildingDefinition;
  holding: Holding;
  idleCrew: CrewMember[];
  isBusy: boolean;
  isStaffing: boolean;
  onRepair: () => void;
  onStaff: (crewIds: string[]) => void;
  onToggleStaffing: () => void;
  onUpgrade: () => void;
  playerCash: number;
};

function HoldingCard({
  crew,
  definition,
  holding,
  idleCrew,
  isBusy,
  isStaffing,
  onRepair,
  onStaff,
  onToggleStaffing,
  onUpgrade,
  playerCash,
}: HoldingCardProps) {
  const staffNames = holding.staff
    .map((id) => crew.find((member) => member.id === id)?.name)
    .filter(Boolean);
  const upgradeCost = buildingUpgradeCost(definition, holding.level + 1);
  const repairCost = buildingRepairCost(definition, holding.level);
  const tillCap = holding.incomeRate * INCOME_STORAGE_HOURS;

  return (
    <article className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 shadow-panel">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className={`m-0 ${displayText} text-2xl text-title`}>
            {definition.name}
          </p>
          <p className={`m-0 ${typography.metadata}`}>
            Level {holding.level}/{MAX_BUILDING_LEVEL}
          </p>
        </div>
        {holding.damaged ? (
          <Tag className="border-danger text-danger-strong" label="Closed" />
        ) : (
          <Tag className="border-brass text-brass" label="Open" />
        )}
      </header>

      <dl className="m-0 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-control border border-line bg-black/20 px-2 py-2">
          <dt className={typography.metadata}>In the till</dt>
          <dd className={`m-0 ${displayText} text-lg text-profit`}>
            {moneyFormatter.format(Math.floor(holding.storedIncome))}
            {tillCap > 0 ? (
              <span className={`ml-1 ${typography.metadata}`}>
                / {moneyFormatter.format(Math.floor(tillCap))}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="rounded-control border border-line bg-black/20 px-2 py-2">
          <dt className={typography.metadata}>Rate/hr</dt>
          <dd className={`m-0 ${displayText} text-lg text-brass-bright`}>
            {moneyFormatter.format(Math.round(holding.incomeRate))}
          </dd>
        </div>
      </dl>

      {definition.staffSlots > 0 ? (
        <div>
          <p className={`m-0 ${typography.metadata}`}>
            Staff ({holding.staff.length}/{definition.staffSlots}) — best run by
            a {CREW_ARCHETYPES[definition.staffArchetype].label}
          </p>
          <p className={`m-0 ${typography.paragraph}`}>
            {staffNames.length > 0 ? staffNames.join(", ") : "Unstaffed (40% output)"}
          </p>
          {isStaffing ? (
            <StaffPicker
              current={holding.staff}
              idleCrew={idleCrew}
              crew={crew}
              isBusy={isBusy}
              onConfirm={onStaff}
              slots={definition.staffSlots}
            />
          ) : (
            <Button
              className="mt-2"
              disabled={isBusy}
              onClick={onToggleStaffing}
              size="small"
              variant="secondary"
            >
              Assign staff
            </Button>
          )}
        </div>
      ) : null}

      <footer className="mt-auto flex flex-wrap gap-2">
        {holding.damaged ? (
          <Button
            disabled={isBusy || playerCash < repairCost}
            onClick={onRepair}
            size="small"
            variant="primary"
          >
            Repair ({moneyFormatter.format(repairCost)})
          </Button>
        ) : holding.level < MAX_BUILDING_LEVEL ? (
          <Button
            disabled={isBusy || playerCash < upgradeCost}
            onClick={onUpgrade}
            size="small"
            variant="secondary"
          >
            Upgrade ({moneyFormatter.format(upgradeCost)})
          </Button>
        ) : null}
      </footer>
    </article>
  );
}

type StaffPickerProps = {
  crew: CrewMember[];
  current: string[];
  idleCrew: CrewMember[];
  isBusy: boolean;
  onConfirm: (crewIds: string[]) => void;
  slots: number;
};

function StaffPicker({
  crew,
  current,
  idleCrew,
  isBusy,
  onConfirm,
  slots,
}: StaffPickerProps) {
  const [selected, setSelected] = useState<string[]>(current);
  const currentMembers = current
    .map((id) => crew.find((member) => member.id === id))
    .filter((member): member is CrewMember => Boolean(member));
  const selectable = [...currentMembers, ...idleCrew].filter(
    (member, index, all) => all.findIndex((m) => m.id === member.id) === index,
  );

  return (
    <div className="mt-2 flex flex-col gap-2">
      {selectable.length === 0 ? (
        <p className={`m-0 ${typography.metadata}`}>Nobody is free to work.</p>
      ) : (
        selectable.map((member) => {
          const isSelected = selected.includes(member.id);
          return (
            <label
              className="flex cursor-pointer items-center gap-2"
              key={member.id}
            >
              <input
                checked={isSelected}
                disabled={!isSelected && selected.length >= slots}
                onChange={() =>
                  setSelected((currentIds) =>
                    isSelected
                      ? currentIds.filter((id) => id !== member.id)
                      : [...currentIds, member.id],
                  )
                }
                type="checkbox"
              />
              <span className={typography.paragraph}>
                {member.name} ({CREW_ARCHETYPES[member.archetype].label})
              </span>
            </label>
          );
        })
      )}
      <Button
        disabled={isBusy}
        onClick={() => onConfirm(selected)}
        size="small"
        variant="primary"
      >
        Confirm shift
      </Button>
    </div>
  );
}
