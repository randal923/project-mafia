"use client";

import { NEWSPAPER_NAME, type NewspaperEdition } from "@shared/newspaper";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthProvider/AuthProvider";
import { Button } from "../../components/Button/Button";
import { typography } from "../../design-system/typography";
import { fetchEditionArchive } from "../../lib/api";
import { cx } from "../../lib/cx";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Serif newsprint styling — the one page that leaves the display face. */
const newsprint = "font-serif text-neutral-200";

export function NewspaperPageContent() {
  const { user } = useAuth();
  const [editions, setEditions] = useState<NewspaperEdition[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const t = useTranslations("newspaper");
  const locale = useLocale();

  useEffect(() => {
    if (!user) {
      return;
    }
    let isCancelled = false;
    fetchEditionArchive(user)
      .then((result) => {
        if (!isCancelled) {
          setEditions(result.editions);
          setSelectedId(result.editions[0]?.id ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const edition = useMemo(
    () => editions?.find((e) => e.id === selectedId) ?? null,
    [editions, selectedId],
  );

  if (!editions) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={typography.metadata}>{t("loading")}</p>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-lg text-center">
          <h1 className={`m-0 ${typography.panelHeading}`}>
            {NEWSPAPER_NAME}
          </h1>
          <p className={`mt-3 ${typography.paragraph}`}>{t("empty")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-6">
      {editions.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {editions.map((entry) => (
            <Button
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
              size="small"
              variant={entry.id === selectedId ? "primary" : "quiet"}
            >
              {t("day", { day: entry.gameDay })}
            </Button>
          ))}
        </div>
      ) : null}

      <article
        className={cx(
          "rounded-panel border border-line bg-neutral-950 px-8 py-10 shadow-panel",
          newsprint,
        )}
      >
        {/* masthead */}
        <header className="border-b-4 border-double border-neutral-500 pb-4 text-center">
          <p className="m-0 text-xs tracking-[0.3em] text-neutral-500 uppercase">
            {t("tagline")}
          </p>
          <h1 className="m-0 font-serif text-5xl font-black tracking-tight text-neutral-100">
            {NEWSPAPER_NAME}
          </h1>
          <p className="m-0 mt-2 text-sm text-neutral-500">
            {t("day", { day: edition.gameDay })} ·{" "}
            {new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(Date.parse(edition.publishedAt))}
            {edition.mastheadChampion
              ? ` · ${t("reign", { family: edition.mastheadChampion })}`
              : ""}
          </p>
        </header>

        {/* headline */}
        <section className="border-b border-neutral-700 py-6">
          <h2 className="m-0 font-serif text-4xl leading-tight font-bold text-neutral-100">
            {edition.headline.title}
          </h2>
          <p className="mt-3 mb-0 text-lg leading-relaxed text-neutral-300">
            {edition.headline.body}
          </p>
        </section>

        {/* articles */}
        <section className="grid gap-x-8 gap-y-6 py-6 md:grid-cols-2">
          {edition.articles.map((article, index) => (
            <div className="break-inside-avoid" key={index}>
              <p className="m-0 text-xs tracking-[0.2em] text-neutral-500 uppercase">
                {t(`sections.${article.section}`)}
              </p>
              <h3 className="m-0 mt-1 font-serif text-2xl leading-snug font-bold text-neutral-200">
                {article.title}
              </h3>
              <p className="mt-2 mb-0 leading-relaxed text-neutral-400">
                {article.body}
              </p>
            </div>
          ))}
        </section>

        {/* standings */}
        {edition.standings.length > 0 ? (
          <section className="border-t border-neutral-700 py-6">
            <h3 className="m-0 text-xs tracking-[0.2em] text-neutral-500 uppercase">
              {t("standingsHeading")}
            </h3>
            <table className="mt-3 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-700 text-sm text-neutral-500">
                  <th className="py-1 pr-4 font-normal">#</th>
                  <th className="py-1 pr-4 font-normal">
                    {t("standings.family")}
                  </th>
                  <th className="py-1 pr-4 text-right font-normal">
                    {t("standings.blocks")}
                  </th>
                  <th className="py-1 text-right font-normal">
                    {t("standings.respect")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {edition.standings.map((standing, index) => (
                  <tr
                    className="border-b border-neutral-800 text-neutral-300"
                    key={standing.familyName}
                  >
                    <td className="py-1 pr-4">{index + 1}</td>
                    <td className="py-1 pr-4">
                      <span
                        className="mr-2 inline-block h-3 w-3 rounded-sm align-middle"
                        style={{ backgroundColor: standing.familyColor }}
                      />
                      {standing.familyName}
                    </td>
                    <td className="py-1 pr-4 text-right">
                      {standing.turfCount}
                    </td>
                    <td className="py-1 text-right">{standing.respect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {/* classifieds */}
        {edition.classifieds.length > 0 ? (
          <section className="border-t border-neutral-700 py-6">
            <h3 className="m-0 text-xs tracking-[0.2em] text-neutral-500 uppercase">
              {t("classifieds")}
            </h3>
            <div className="mt-3 flex flex-col gap-3">
              {edition.classifieds.map((classified, index) => (
                <p
                  className="m-0 border border-dashed border-neutral-600 p-3 text-sm leading-relaxed text-neutral-300 italic"
                  key={index}
                >
                  {classified.text}
                  {classified.type === "bounty"
                    ? ` ${t("bounty", {
                        amount: moneyFormatter.format(classified.bounty),
                        family: classified.targetName,
                      })}`
                    : ""}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
