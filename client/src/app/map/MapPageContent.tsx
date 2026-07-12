"use client";

import type { BattleReport } from "@shared/battle";
import { crewJobCapacity, type CrewMember } from "@shared/crew";
import { PLAYER_RANKS } from "@shared/player";
import {
  FAMILY_COLORS,
  TERRITORY_UNLOCK_RANK,
  type TurfState,
} from "@shared/territory";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { CityMapSvg } from "../../components/CityMap/CityMapSvg";
import { TurfDetailPanel } from "../../components/CityMap/TurfDetailPanel";
import { CrewPicker } from "../../components/Crew/CrewPicker";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { TextInput } from "../../components/TextInput/TextInput";
import { Toast } from "../../components/Toast/Toast";
import { displayText, typography } from "../../design-system/typography";
import {
  ApiError,
  assignTurfDefense,
  attackTurf,
  buildRacket,
  claimTurf,
  fetchBattles,
  fetchCrewRoster,
  fetchMapView,
  foundFamily,
  repairRacket,
  staffRacket,
  upgradeRacket,
  type MapViewResponse,
} from "../../lib/api";

const POLL_INTERVAL_MS = 45_000;

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

type MapToast = {
  message: string;
  title: string;
  tone: "failure" | "success";
};

type PendingAction =
  | { kind: "attack"; turfId: string }
  | { kind: "claim"; turfId: string }
  | { kind: "defense"; turfId: string };

export function MapPageContent() {
  const t = useTranslations("map");
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const router = useRouter();
  const [view, setView] = useState<MapViewResponse | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [battles, setBattles] = useState<BattleReport[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<MapToast | null>(null);
  const [colorChoice, setColorChoice] = useState<string>(FAMILY_COLORS[0]);
  const [familyName, setFamilyName] = useState("");

  const isUnlocked =
    player &&
    PLAYER_RANKS.indexOf(player.rank) >=
      PLAYER_RANKS.indexOf(TERRITORY_UNLOCK_RANK);

  const refresh = useCallback(() => {
    if (!user) {
      return;
    }
    fetchMapView(user)
      .then(setView)
      .catch(() => undefined);
    fetchCrewRoster(user)
      .then((result) => setCrew(result.crew))
      .catch(() => undefined);
    fetchBattles(user)
      .then((result) => setBattles(result.battles))
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user || !isUnlocked) {
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, isUnlocked, refresh]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedTurf = useMemo(
    () => view?.turfs.find((turf) => turf.id === selectedTurfId) ?? null,
    [selectedTurfId, view],
  );
  const idleCrew = useMemo(
    () => crew.filter((member) => member.status === "idle"),
    [crew],
  );

  if (status === "loading" || status === "missing" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>{t("loading")}</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-lg text-center">
          <h1 className={`m-0 ${typography.panelHeading}`}>
            {t("locked.title")}
          </h1>
          <p className={`mt-3 ${typography.paragraph}`}>
            {t("locked.beforeRank")} <strong>{t("locked.rank")}</strong>{" "}
            {t("locked.afterRank")}
          </p>
        </div>
      </div>
    );
  }

  // ---- family founding gate ----
  if (!player.family) {
    const trimmedName = familyName.trim();
    const nameValid = trimmedName.length >= 3 && trimmedName.length <= 24;

    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xl rounded-panel border border-line bg-surface p-8 shadow-panel">
          <h1 className={`m-0 ${typography.panelHeading}`}>
            {t("found.title")}
          </h1>
          <p className={`mt-3 ${typography.paragraph}`}>{t("found.intro")}</p>
          <div className="mt-5">
            <TextInput
              id="family-name"
              label={t("found.nameLabel")}
              maxLength={24}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder={t("found.namePlaceholder")}
              value={familyName}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {FAMILY_COLORS.map((color) => (
              <button
                aria-label={t("found.colorAria", { color })}
                aria-pressed={colorChoice === color}
                className="h-12 w-12 cursor-pointer rounded-control border-2 transition-transform duration-150 hover:scale-110"
                key={color}
                onClick={() => setColorChoice(color)}
                style={{
                  backgroundColor: color,
                  borderColor: colorChoice === color ? "#e8c56a" : "#444",
                }}
                type="button"
              />
            ))}
          </div>
          <Button
            className="mt-6"
            disabled={isBusy || !nameValid}
            onClick={() =>
              void (async () => {
                if (!user) return;
                setIsBusy(true);
                try {
                  const result = await foundFamily(
                    user,
                    colorChoice,
                    trimmedName,
                  );
                  setPlayer(result.player);
                } catch (error) {
                  setToast({
                    message:
                      error instanceof ApiError
                        ? error.message
                        : t("found.errorMessage"),
                    title: t("found.errorTitle"),
                    tone: "failure",
                  });
                } finally {
                  setIsBusy(false);
                }
              })()
            }
            variant="primary"
          >
            {t("found.submit")}
          </Button>
        </div>
      </div>
    );
  }

  const runTurfAction = async (
    action: () => Promise<{ turf: TurfState }>,
    successTitle: string,
    successMessage: string,
  ) => {
    if (!user || isBusy) return;
    setIsBusy(true);
    try {
      const result = await action();
      setView((current) =>
        current
          ? {
              ...current,
              turfs: current.turfs.map((turf) =>
                turf.id === result.turf.id ? result.turf : turf,
              ),
            }
          : current,
      );
      setToast({ message: successMessage, title: successTitle, tone: "success" });
      refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError ? error.message : t("toasts.genericError"),
        title: t("toasts.noDiceTitle"),
        tone: "failure",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handlePickerConfirm = async (crewIds: string[]) => {
    if (!user || !pending) return;
    const action = pending;
    setIsBusy(true);
    try {
      if (action.kind === "claim") {
        await claimTurf(user, action.turfId, crewIds);
        setPending(null);
        // The takeover is a live mission now — play it out on the Jobs page.
        router.push("/jobs");
        return;
      }
      if (action.kind === "attack") {
        const { battle } = await attackTurf(user, action.turfId, crewIds);
        setPending(null);
        setToast({
          message: battle.turfFlipped
            ? t("toasts.attackWin", {
                bounty: battle.bountyCollected
                  ? t("toasts.attackWinBounty", {
                      amount: moneyFormatter.format(battle.bountyCollected),
                    })
                  : "",
                skim:
                  battle.incomeSkimmed > 0
                    ? t("toasts.attackWinSkim", {
                        amount: moneyFormatter.format(battle.incomeSkimmed),
                      })
                    : "",
                turf: battle.turfName,
              })
            : battle.tier === "partial_failure"
              ? t("toasts.attackPartial", { turf: battle.turfName })
              : t("toasts.attackRout", { turf: battle.turfName }),
          title: battle.turfFlipped
            ? t("toasts.flagPlanted")
            : t("toasts.theyHeld"),
          tone: battle.turfFlipped ? "success" : "failure",
        });
        refresh();
        return;
      }
      await runTurfAction(
        () => assignTurfDefense(user, action.turfId, crewIds),
        t("toasts.defenseTitle"),
        t("toasts.defenseMessage"),
      );
      setPending(null);
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError ? error.message : t("toasts.genericError"),
        title: t("toasts.noDiceTitle"),
        tone: "failure",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const countdown = view?.season.strongholdCountdown;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`m-0 ${typography.panelHeading}`}>
            {t("header.title")}
          </h1>
          <p className={`mt-1 mb-0 ${typography.paragraph}`}>
            {t("header.subtitle")}{" "}
            {view
              ? t("header.seasonEnds", {
                  date: new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "long",
                  }).format(Date.parse(view.season.endsAt)),
                  season: view.season.name,
                })
              : ""}
          </p>
        </div>
        {view ? (
          <div className="flex flex-wrap items-center gap-3">
            {view.families.slice(0, 6).map((family) => (
              <span className="inline-flex items-center gap-2" key={family.uid}>
                <span
                  className="inline-block h-4 w-4 rounded-sm"
                  style={{ backgroundColor: family.color }}
                />
                <span className={typography.metadata}>
                  {family.name} ({family.turfCount})
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {countdown ? (
        <div className="rounded-panel border border-danger bg-danger/10 px-6 py-4">
          <p className={`m-0 ${displayText} text-xl text-danger-strong`}>
            {t("conquestClock", { family: countdown.familyName })}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {!view ? (
          <p className={typography.metadata}>{t("surveying")}</p>
        ) : (
          <CityMapSvg
            onSelect={setSelectedTurfId}
            selectedTurfId={selectedTurfId}
            turfs={view.turfs}
            viewerUid={player.id}
          />
        )}
        {selectedTurf ? (
          <TurfDetailPanel
            crew={crew}
            isBusy={isBusy}
            onAttack={() =>
              setPending({ kind: "attack", turfId: selectedTurf.id })
            }
            onBuild={(definitionId) =>
              void runTurfAction(
                () => buildRacket(user!, selectedTurf.id, definitionId),
                t("toasts.buildTitle"),
                t("toasts.buildMessage"),
              )
            }
            onClaim={() =>
              setPending({ kind: "claim", turfId: selectedTurf.id })
            }
            onDefend={() =>
              setPending({ kind: "defense", turfId: selectedTurf.id })
            }
            onRepairBuilding={(buildingId) =>
              void runTurfAction(
                () => repairRacket(user!, selectedTurf.id, buildingId),
                t("toasts.backInBusinessTitle"),
                t("toasts.backInBusinessMessage"),
              )
            }
            onStaffBuilding={(buildingId, crewIds) =>
              void runTurfAction(
                () => staffRacket(user!, selectedTurf.id, buildingId, crewIds),
                t("toasts.staffTitle"),
                t("toasts.staffMessage"),
              )
            }
            onUpgradeBuilding={(buildingId) =>
              void runTurfAction(
                () => upgradeRacket(user!, selectedTurf.id, buildingId),
                t("toasts.upgradeTitle"),
                t("toasts.upgradeMessage"),
              )
            }
            player={player}
            turf={selectedTurf}
          />
        ) : (
          <aside className="flex items-center justify-center rounded-panel border border-line bg-surface p-8 shadow-panel">
            <p className={`m-0 text-center ${typography.narrativeCaption}`}>
              {t("emptyPanel")}
            </p>
          </aside>
        )}
      </div>

      {battles.length > 0 ? (
        <section>
          <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>
            {t("battles.title")}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {battles.slice(0, 8).map((battle) => {
              const won = battle.attackerUid === player.id
                ? battle.turfFlipped
                : !battle.turfFlipped;
              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface px-4 py-3"
                  key={battle.id}
                >
                  <span className={typography.paragraph}>
                    <strong>{battle.attackerName}</strong>{" "}
                    {battle.kind === "landmark_siege"
                      ? t("battles.stormed")
                      : t("battles.hit")}{" "}
                    <strong>{battle.turfName}</strong>
                    {battle.defenderName
                      ? ` ${t("battles.heldBy", { name: battle.defenderName })}`
                      : ""}
                    {" — "}
                    {battle.turfFlipped
                      ? t("battles.blockFell")
                      : t("battles.defenseHeld")}
                    {battle.incomeSkimmed > 0
                      ? t("battles.skimmed", {
                          amount: moneyFormatter.format(battle.incomeSkimmed),
                        })
                      : ""}
                    .
                  </span>
                  <span
                    className={`${typography.metadata} ${won ? "text-teal" : "text-danger-strong"}`}
                  >
                    {new Intl.DateTimeFormat("en-US", {
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                    }).format(Date.parse(battle.createdAt))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {pending ? (
        <CrewPicker
          capacity={
            pending.kind === "defense"
              ? 8
              : pending.kind === "attack"
                ? 8
                : crewJobCapacity(player.progression.skills.leadership)
          }
          confirmLabel={
            pending.kind === "claim"
              ? t("picker.claimConfirm")
              : pending.kind === "attack"
                ? t("picker.attackConfirm")
                : t("picker.defenseConfirm")
          }
          crew={
            pending.kind === "defense"
              ? crew.filter(
                  (member) =>
                    member.status === "idle" ||
                    (member.status === "assigned_turf" &&
                      member.assignment === pending.turfId),
                )
              : idleCrew
          }
          intro={
            pending.kind === "claim"
              ? t("picker.claimIntro")
              : pending.kind === "attack"
                ? t("picker.attackIntro")
                : t("picker.defenseIntro")
          }
          isBusy={isBusy}
          onCancel={() => setPending(null)}
          onConfirm={(crewIds) => void handlePickerConfirm(crewIds)}
          title={
            pending.kind === "claim"
              ? t("picker.claimTitle")
              : pending.kind === "attack"
                ? t("picker.attackTitle")
                : t("picker.defenseTitle")
          }
        />
      ) : null}

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
