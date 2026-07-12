"use client";

import type { BattleReport } from "@shared/battle";
import { crewJobCapacity, type CrewMember } from "@shared/crew";
import { PLAYER_RANKS } from "@shared/player";
import {
  FAMILY_COLORS,
  TERRITORY_UNLOCK_RANK,
  type TurfState,
} from "@shared/territory";
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
        <p className={typography.metadata}>Unfolding the map…</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-lg text-center">
          <h1 className={`m-0 ${typography.panelHeading}`}>The City</h1>
          <p className={`mt-3 ${typography.paragraph}`}>
            The map opens when you make <strong>Local Boss</strong> (level 40).
            Keep working — the city will still be here.
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
          <h1 className={`m-0 ${typography.panelHeading}`}>Found your family</h1>
          <p className={`mt-3 ${typography.paragraph}`}>
            Before you paint the map, the city needs a name to fear and a color
            to recognize. Choose both carefully — the Ledger will print them.
          </p>
          <div className="mt-5">
            <TextInput
              id="family-name"
              label="Family name"
              maxLength={24}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder="e.g. The Moretti Family"
              value={familyName}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {FAMILY_COLORS.map((color) => (
              <button
                aria-label={`Family color ${color}`}
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
                        : "The founding didn't take. Try again.",
                    title: "Not yet",
                    tone: "failure",
                  });
                } finally {
                  setIsBusy(false);
                }
              })()
            }
            variant="primary"
          >
            Fly the colors
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
          error instanceof ApiError ? error.message : "That didn't work.",
        title: "No dice",
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
            ? `You took ${battle.turfName}${battle.incomeSkimmed > 0 ? ` and skimmed ${moneyFormatter.format(battle.incomeSkimmed)}` : ""}${battle.bountyCollected ? `, collecting a ${moneyFormatter.format(battle.bountyCollected)} bounty` : ""}.`
            : battle.tier === "partial_failure"
              ? `${battle.turfName} held, but you dented its defenses. Hit it again.`
              : `A rout at ${battle.turfName}. Your soldiers paid for it.`,
          title: battle.turfFlipped ? "Flag planted" : "They held",
          tone: battle.turfFlipped ? "success" : "failure",
        });
        refresh();
        return;
      }
      await runTurfAction(
        () => assignTurfDefense(user, action.turfId, crewIds),
        "Guard posted",
        "Your soldiers took their corners.",
      );
      setPending(null);
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError ? error.message : "That didn't work.",
        title: "No dice",
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
          <h1 className={`m-0 ${typography.panelHeading}`}>The City</h1>
          <p className={`mt-1 mb-0 ${typography.paragraph}`}>
            Seventy blocks, seven districts, one winner.{" "}
            {view ? `${view.season.name} ends ${new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long" }).format(Date.parse(view.season.endsAt))}.` : ""}
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
            THE CONQUEST CLOCK IS RUNNING — the {countdown.familyName} family
            holds every district. Break their grip before the 72 hours run out.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {!view ? (
          <p className={typography.metadata}>Surveying the streets…</p>
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
                "Ground broken",
                "The racket opens damaged-free and starts earning.",
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
                "Back in business",
                "The doors are open again.",
              )
            }
            onStaffBuilding={(buildingId, crewIds) =>
              void runTurfAction(
                () => staffRacket(user!, selectedTurf.id, buildingId, crewIds),
                "Shift assigned",
                "The floor is covered.",
              )
            }
            onUpgradeBuilding={(buildingId) =>
              void runTurfAction(
                () => upgradeRacket(user!, selectedTurf.id, buildingId),
                "Expanded",
                "Bigger floor, bigger take.",
              )
            }
            player={player}
            turf={selectedTurf}
          />
        ) : (
          <aside className="flex items-center justify-center rounded-panel border border-line bg-surface p-8 shadow-panel">
            <p className={`m-0 text-center ${typography.narrativeCaption}`}>
              Pick a block. Gray is unclaimed; colors are families; ★ marks the
              landmarks money can’t buy.
            </p>
          </aside>
        )}
      </div>

      {battles.length > 0 ? (
        <section>
          <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>
            Recent battles
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
                    {battle.kind === "landmark_siege" ? "stormed" : "hit"}{" "}
                    <strong>{battle.turfName}</strong>
                    {battle.defenderName ? ` (held by ${battle.defenderName})` : ""}
                    {" — "}
                    {battle.turfFlipped ? "the block fell" : "the defense held"}
                    {battle.incomeSkimmed > 0
                      ? `, ${moneyFormatter.format(battle.incomeSkimmed)} skimmed`
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
              ? "Start the takeover"
              : pending.kind === "attack"
                ? "Launch the assault"
                : "Post them"
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
              ? "The takeover plays like a job — your crew's specialties boost its checks."
              : pending.kind === "attack"
                ? "Committed soldiers add their power to the assault. A rout costs bodies and gear."
                : "Posted defenders add double their power to this block's defense."
          }
          isBusy={isBusy}
          onCancel={() => setPending(null)}
          onConfirm={(crewIds) => void handlePickerConfirm(crewIds)}
          title={
            pending.kind === "claim"
              ? "Who works the takeover?"
              : pending.kind === "attack"
                ? "Who marches?"
                : "Who stands guard?"
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
