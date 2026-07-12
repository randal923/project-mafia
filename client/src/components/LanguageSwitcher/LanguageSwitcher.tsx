"use client";

import type { PlayerLanguage } from "@shared/language";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLanguage } from "../LanguageProvider/LanguageProvider";

/* Placeholder flags drawn inline; swap for real artwork later. */

function UsFlag() {
  return (
    <svg aria-hidden className="h-4 w-6 rounded-[2px]" viewBox="0 0 24 16">
      <rect fill="#f5f0e6" height="16" width="24" />
      {[0, 1, 2, 3, 4, 5, 6].map((stripe) => (
        <rect
          fill="#b22234"
          height="1.23"
          key={stripe}
          width="24"
          y={stripe * 2.46}
        />
      ))}
      <rect fill="#3c3b6e" height="8.6" width="9.6" />
      {[1.6, 4.8, 8].map((x) =>
        [1.4, 4.3, 7.2].map((y) => (
          <circle cx={x} cy={y} fill="#f5f0e6" key={`${x}-${y}`} r="0.55" />
        ))
      )}
    </svg>
  );
}

function BrFlag() {
  return (
    <svg aria-hidden className="h-4 w-6 rounded-[2px]" viewBox="0 0 24 16">
      <rect fill="#009c3b" height="16" width="24" />
      <polygon fill="#ffdf00" points="12,1.5 22,8 12,14.5 2,8" />
      <circle cx="12" cy="8" fill="#002776" r="3" />
    </svg>
  );
}

const OPTIONS: ReadonlyArray<{
  Flag: () => React.JSX.Element;
  id: PlayerLanguage;
  labelKey: "english" | "portuguese";
}> = [
  { Flag: UsFlag, id: "en", labelKey: "english" },
  { Flag: BrFlag, id: "pt-BR", labelKey: "portuguese" }
];

export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const { language, setLanguage } = useLanguage();
  const router = useRouter();

  const selectLanguage = (nextLanguage: PlayerLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    router.refresh();
  };

  return (
    <div aria-label={t("label")} className="flex items-center gap-1" role="group">
      {OPTIONS.map(({ Flag, id, labelKey }) => {
        const isActive = language === id;

        return (
          <button
            aria-label={t(labelKey)}
            aria-pressed={isActive}
            className={`inline-flex min-h-8 items-center rounded-control border px-2 py-1 transition-[border-color,opacity] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright ${
              isActive
                ? "border-brass"
                : "border-transparent opacity-50 hover:border-line hover:opacity-100"
            }`}
            key={id}
            onClick={() => selectLanguage(id)}
            title={t(labelKey)}
            type="button"
          >
            <Flag />
          </button>
        );
      })}
    </div>
  );
}
