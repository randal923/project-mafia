"use client";

import {
  CREW_ARCHETYPES,
  CREW_ROSTER_CAP_BY_RANK,
  CREW_UNLOCK_RANK,
  crewWage,
  isCrewSlot,
  type CrewCandidate,
  type CrewMember,
  type CrewSlotId,
} from "@shared/crew";
import { PLAYER_RANKS, type PlayerItem } from "@shared/player";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { CrewMemberCard } from "../../components/Crew/CrewMemberCard";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { Tag } from "../../components/Tag/Tag";
import { Toast } from "../../components/Toast/Toast";
import { displayText, typography } from "../../design-system/typography";
import {
  ApiError,
  bribeCrewMember,
  equipCrewMember,
  fetchCrewRoster,
  fetchRecruitmentPool,
  fireCrewMember,
  hireCrewCandidate,
  trainCrewMember,
  unequipCrewMember,
} from "../../lib/api";
import { useCatalogText } from "../../lib/useCatalogText";
import { useCrewText } from "../../lib/useCrewText";
import { useFormatters } from "../../lib/useFormatters";

type CrewToast = {
  message: string;
  title: string;
  tone: "failure" | "success";
};

export function CrewPageContent() {
  const t = useTranslations("crew");
  const { moneyFormatter } = useFormatters();
  const { crewBio, crewName } = useCrewText();
  const { archetypeName, skillName, tierName, traitName } = useCatalogText();
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const [crew, setCrew] = useState<CrewMember[] | null>(null);
  const [candidates, setCandidates] = useState<CrewCandidate[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<CrewToast | null>(null);

  const isUnlocked =
    player &&
    PLAYER_RANKS.indexOf(player.rank) >= PLAYER_RANKS.indexOf(CREW_UNLOCK_RANK);

  useEffect(() => {
    if (!user || !isUnlocked) {
      return;
    }

    let isCancelled = false;
    fetchCrewRoster(user)
      .then((result) => {
        if (!isCancelled) {
          setCrew(result.crew);
          setPlayer(result.player);
        }
      })
      .catch(() => undefined);
    fetchRecruitmentPool(user)
      .then((result) => {
        if (!isCancelled) {
          setCandidates(result.pool.candidates);
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUnlocked, player?.language]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const eligibleItems = useMemo<PlayerItem[]>(() => {
    if (!player) {
      return [];
    }
    // Duplicate copies of the same gear are interchangeable — the equip
    // call targets by id — so the picker lists each id once.
    const seen = new Set<string>();
    return player.stash.filter((item) => {
      if (!item.slot || !isCrewSlot(item.slot) || item.consumable) {
        return false;
      }
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [player]);

  const runAction = useCallback(
    async (
      action: () => Promise<{ crew: CrewMember[]; player?: unknown }>,
      successTitle: string,
      successMessage: string,
    ) => {
      if (!user || isBusy) {
        return;
      }
      setIsBusy(true);
      try {
        const result = await action();
        setCrew(result.crew);
        if (result.player) {
          setPlayer(result.player as never);
        }
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
              : t("toast.errorMessage"),
          title: t("toast.errorTitle"),
          tone: "failure",
        });
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy, setPlayer, t, user],
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
            {t("locked.beforeRank")}{" "}
            <strong>{t("locked.rankName")}</strong> {t("locked.afterRank")}
          </p>
        </div>
      </div>
    );
  }

  const cap = CREW_ROSTER_CAP_BY_RANK[player.rank];
  const totalWages = (crew ?? []).reduce(
    (sum, member) =>
      sum + crewWage(member.tier, member.skillLevel, member.traits),
    0,
  );

  const handleHire = (candidate: CrewCandidate) =>
    void runAction(
      async () => {
        const result = await hireCrewCandidate(user!, candidate.id);
        setCandidates(
          (current) => current?.filter((c) => c.id !== candidate.id) ?? null,
        );
        return result;
      },
      t("toast.hired.title"),
      t("toast.hired.message", { name: crewName(candidate.name) }),
    );

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-panel border border-line bg-surface px-6 py-5 shadow-panel">
        <div>
          <p className={`m-0 ${displayText} text-xl text-faint`}>
            {t("header.eyebrow")}
          </p>
          <h1 className={`mt-1 mb-0 ${displayText} text-5xl text-title`}>
            {t("header.title")}
          </h1>
          <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
            {t("header.tagline")}
          </p>
        </div>
        <dl className="m-0 flex gap-8 text-right">
          <div>
            <dt className={typography.metadata}>{t("header.roster")}</dt>
            <dd className={`m-0 ${displayText} text-3xl text-brass-bright`}>
              {crew?.length ?? "—"}/{cap}
            </dd>
          </div>
          <div>
            <dt className={typography.metadata}>
              {t("header.payrollPerDay")}
            </dt>
            <dd className={`m-0 ${displayText} text-3xl text-danger-strong`}>
              {moneyFormatter.format(totalWages)}
            </dd>
          </div>
          <div>
            <dt className={typography.metadata}>{t("header.yourCash")}</dt>
            <dd className={`m-0 ${displayText} text-3xl text-profit`}>
              {moneyFormatter.format(player.resources.cash)}
            </dd>
          </div>
        </dl>
      </header>

      <section>
        <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>
          {t("roster.heading")}
        </h2>
        {!crew ? (
          <p className={typography.metadata}>{t("roster.loading")}</p>
        ) : crew.length === 0 ? (
          <p className={typography.metadata}>{t("roster.empty")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {crew.map((member) => (
              <CrewMemberCard
                eligibleItems={eligibleItems}
                isBusy={isBusy}
                key={member.id}
                member={member}
                onBribe={(memberId) =>
                  void runAction(
                    () => bribeCrewMember(user!, memberId),
                    t("toast.bribed.title"),
                    t("toast.bribed.message"),
                  )
                }
                onEquip={(memberId, itemId) =>
                  void runAction(
                    () => equipCrewMember(user!, memberId, itemId),
                    t("toast.equipped.title"),
                    t("toast.equipped.message"),
                  )
                }
                onFire={(memberId) =>
                  void runAction(
                    async () => fireCrewMember(user!, memberId),
                    t("toast.fired.title"),
                    t("toast.fired.message"),
                  )
                }
                onTrain={(memberId) =>
                  void runAction(
                    () => trainCrewMember(user!, memberId),
                    t("toast.trained.title"),
                    t("toast.trained.message"),
                  )
                }
                onUnequip={(memberId, slot: CrewSlotId) =>
                  void runAction(
                    () => unequipCrewMember(user!, memberId, slot),
                    t("toast.unequipped.title"),
                    t("toast.unequipped.message"),
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={`m-0 mb-3 ${typography.panelHeading}`}>
          {t("recruitment.heading")}
        </h2>
        <p className={`mt-0 mb-3 ${typography.narrativeCaption}`}>
          {t("recruitment.intro")}
        </p>
        {!candidates ? (
          <p className={typography.metadata}>{t("recruitment.loading")}</p>
        ) : candidates.length === 0 ? (
          <p className={typography.metadata}>{t("recruitment.empty")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => (
              <article
                className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5 shadow-panel"
                key={candidate.id}
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`m-0 ${displayText} text-2xl text-title`}>
                      {crewName(candidate.name)}
                    </p>
                    <p className={`m-0 ${typography.metadata}`}>
                      {tierName(candidate.tier)} ·{" "}
                      {archetypeName(candidate.archetype)}
                    </p>
                  </div>
                  <div className="rounded-control border border-brass/50 bg-brass/10 px-3 py-1 text-center">
                    <p className={`m-0 ${typography.metadata}`}>
                      {skillName(CREW_ARCHETYPES[candidate.archetype].skill)}
                    </p>
                    <p className={`m-0 ${displayText} text-lg text-brass-bright`}>
                      {candidate.skillLevel}
                    </p>
                  </div>
                </header>
                <p className={`m-0 ${typography.narrativeCaption}`}>
                  {crewBio(candidate)}
                </p>
                {candidate.traits.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidate.traits.map((trait) => (
                      <Tag
                        className="border-brass/60 text-brass"
                        key={trait}
                        label={traitName(trait)}
                      />
                    ))}
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className={typography.metadata}>
                    {t("recruitment.wagePerDay", {
                      wage: moneyFormatter.format(candidate.wage),
                    })}
                  </span>
                  <Button
                    disabled={
                      isBusy ||
                      (crew?.length ?? 0) >= cap ||
                      player.resources.cash < candidate.hireCost
                    }
                    onClick={() => handleHire(candidate)}
                    size="small"
                    variant="primary"
                  >
                    {t("recruitment.hire", {
                      cost: moneyFormatter.format(candidate.hireCost),
                    })}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
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
