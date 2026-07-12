import type { PlayerLanguage } from "@shared/language";
import type { NewspaperCopy, NewspaperEdition } from "@shared/newspaper";

type NewspaperCopyTranslation = (
  key: string,
  values?: { day: number },
) => string;

export function selectNewspaperCopy(
  edition: NewspaperEdition,
  language: PlayerLanguage,
  translate: NewspaperCopyTranslation,
): NewspaperCopy {
  if (language === "en") {
    return {
      articles: edition.articles,
      headline: edition.headline,
    };
  }

  if (edition.ptBR) {
    return edition.ptBR;
  }

  return {
    articles: [
      {
        body: translate("legacy.articleBody", { day: edition.gameDay }),
        section: "crime_blotter",
        title: translate("legacy.articleTitle", { day: edition.gameDay }),
      },
    ],
    headline: {
      body: translate("legacy.headlineBody", { day: edition.gameDay }),
      section: "front_page",
      title: translate("legacy.headlineTitle", { day: edition.gameDay }),
    },
  };
}
