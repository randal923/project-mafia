"use client";

import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CATEGORY_LABELS,
  type Equipment,
  type EquipmentCategory,
} from "@shared/equipment";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { DropdownMenu } from "../../components/DropdownMenu/DropdownMenu";
import { usePlayer } from "../../components/PlayerProvider/PlayerProvider";
import { StoreItemCard } from "../../components/Store/StoreItemCard";
import { TextInput } from "../../components/TextInput/TextInput";
import { Toast } from "../../components/Toast/Toast";
import { displayText, typography } from "../../design-system/typography";
import { ApiError, buyEquipment, fetchStoreCatalog } from "../../lib/api";
import { cx } from "../../lib/cx";

type CategoryFilter = "all" | EquipmentCategory;
type RequirementLevelFilter = "all" | number;

type StoreToast = {
  message: string;
  title: string;
  tone: "failure" | "success";
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export function StorePageContent() {
  const { user } = useAuth();
  const { player, setPlayer, status } = usePlayer();
  const [catalog, setCatalog] = useState<Equipment[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [equipmentNameQuery, setEquipmentNameQuery] = useState("");
  const [requirementLevelFilter, setRequirementLevelFilter] =
    useState<RequirementLevelFilter>("all");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<StoreToast | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;
    fetchStoreCatalog(user)
      .then((result) => {
        if (!isCancelled) {
          setRequirementLevelFilter((currentLevel) =>
            currentLevel === "all" ||
            result.items.some(
              (item) => item.levelRequirement === currentLevel
            )
              ? currentLevel
              : "all"
          );
          setCatalog(result.items);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load the store catalog:", error);
        if (!isCancelled) {
          setCatalogError(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const ownedByEquipmentId = useMemo(() => {
    const owned = new Map<string, number>();
    if (!player) {
      return owned;
    }
    for (const item of player.stash) {
      owned.set(item.id, (owned.get(item.id) ?? 0) + (item.quantity ?? 1));
    }
    for (const item of Object.values(player.loadout)) {
      if (item) {
        owned.set(item.id, (owned.get(item.id) ?? 0) + 1);
      }
    }
    return owned;
  }, [player]);

  const categories = useMemo<CategoryFilter[]>(() => {
    if (!catalog) {
      return ["all"];
    }
    const present = new Set(catalog.map((item) => item.category));
    return ["all", ...EQUIPMENT_CATEGORIES.filter((c) => present.has(c))];
  }, [catalog]);

  const requirementLevels = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return [...new Set(catalog.map((item) => item.levelRequirement))].sort(
      (first, second) => first - second,
    );
  }, [catalog]);

  const visibleItems = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const normalizedNameQuery = equipmentNameQuery.trim().toLowerCase();

    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedNameQuery) &&
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (requirementLevelFilter === "all" ||
          item.levelRequirement === requirementLevelFilter),
    );
  }, [catalog, categoryFilter, equipmentNameQuery, requirementLevelFilter]);

  if (status === "loading" || status === "missing" || !player) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>Opening the back room…</p>
      </div>
    );
  }

  const handleBuy = async (equipmentId: string) => {
    if (!user || busyItemId) {
      return;
    }

    const item = catalog?.find((entry) => entry.id === equipmentId);
    setBusyItemId(equipmentId);
    try {
      const result = await buyEquipment(user, equipmentId);
      setPlayer(result.player);
      setToast({
        message: `${item?.name ?? "Gear"} moved to your stash.`,
        title: "Deal done",
        tone: "success",
      });
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError
            ? error.message
            : "The fence isn't answering. Try again.",
        title: "No deal",
        tone: "failure",
      });
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-panel border border-line bg-surface px-6 py-5 shadow-panel">
        <div>
          <p className={`m-0 ${displayText} text-xl text-faint`}>
            Back-room armory
          </p>
          <h1 className={`mt-1 mb-0 ${displayText} text-5xl text-title`}>
            The Store
          </h1>
          <p className={`mt-2 mb-0 ${typography.narrativeCaption}`}>
            Cash buys the gear; jobs decide if you needed it. Locked pieces open
            up as you level.
          </p>
        </div>
        <dl className="m-0 flex gap-8 text-right">
          <div>
            <dt className={typography.metadata}>Your cash</dt>
            <dd className={`m-0 ${displayText} text-3xl text-profit`}>
              {moneyFormatter.format(player.resources.cash)}
            </dd>
          </div>
          <div>
            <dt className={typography.metadata}>Level</dt>
            <dd className={`m-0 ${displayText} text-3xl text-brass-bright`}>
              {player.progression.level}
            </dd>
          </div>
        </dl>
      </header>
      <nav aria-label="Store categories" className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            aria-pressed={categoryFilter === category}
            className={cx(
              `cursor-pointer rounded-control border px-4 py-2 ${displayText} text-lg transition-colors duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright`,
              categoryFilter === category
                ? "border-brass bg-brass/15 text-brass-bright"
                : "border-line bg-transparent text-muted hover:border-brass hover:text-brass",
            )}
            key={category}
            onClick={() => setCategoryFilter(category)}
            type="button"
          >
            {category === "all"
              ? "Everything"
              : EQUIPMENT_CATEGORY_LABELS[category]}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <TextInput
          className="w-full"
          id="equipment-name-search"
          label="Equipment name"
          onChange={(event) => setEquipmentNameQuery(event.target.value)}
          placeholder="Search by name"
          type="search"
          value={equipmentNameQuery}
        />

        <div className="sm:w-64">
          <DropdownMenu
            className="focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright"
            label="Required level"
            onChange={(event) => {
              const nextLevel = event.target.value;
              if (nextLevel === "all") {
                setRequirementLevelFilter("all");
                return;
              }

              const parsedLevel = Number(nextLevel);
              if (requirementLevels.includes(parsedLevel)) {
                setRequirementLevelFilter(parsedLevel);
              }
            }}
            options={[
              { label: "All required levels", value: "all" },
              ...requirementLevels.map((level) => ({
                label: `Level ${level}`,
                value: String(level),
              })),
            ]}
            value={String(requirementLevelFilter)}
          />
        </div>
      </div>

      {catalogError ? (
        <p className={typography.metadata}>
          The store is shuttered. Refresh to try again.
        </p>
      ) : !catalog ? (
        <p className={typography.metadata}>Laying the goods out…</p>
      ) : catalog.length === 0 ? (
        <p className={typography.metadata} role="status">
          No gear is currently available.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className={typography.metadata} role="status">
          No gear matches your current search and filters. Try another name,
          category, or required level.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <StoreItemCard
              isBusy={busyItemId === item.id}
              isLocked={player.progression.level < item.levelRequirement}
              item={item}
              key={item.id}
              onBuy={handleBuy}
              ownedQuantity={ownedByEquipmentId.get(item.id) ?? 0}
              playerCash={player.resources.cash}
            />
          ))}
        </div>
      )}

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
