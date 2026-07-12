import type { DistrictId } from "@shared/district";
import type { NewspaperClassified } from "@shared/newspaper";

type ClassifiedTranslation = (
  key: string,
  values?: Record<string, number | string>,
) => string;

type ClassifiedFormatters = {
  date: (value: string) => string;
  district: (id: DistrictId) => string;
  item: (id: string) => string;
  money: (amount: number) => string;
  number: (amount: number) => string;
};

export function formatNewspaperClassified(
  classified: NewspaperClassified,
  formatters: ClassifiedFormatters,
  translate: ClassifiedTranslation,
): string {
  switch (classified.type) {
    case "bounty":
      return translate("bounty", {
        amount: formatters.money(classified.bounty),
        family: classified.targetName,
      });
    case "mission_modifier":
      return translate("classifiedFallback.missionModifier", {
        district: formatters.district(classified.district),
        heat: formatters.number(classified.heatFactor),
        payout: formatters.number(classified.payoutFactor),
        until: formatters.date(classified.until),
      });
    case "store_drop":
      return translate("classifiedFallback.storeDrop", {
        discount: formatters.number(
          Math.round((1 - classified.priceFactor) * 100),
        ),
        item: formatters.item(classified.equipmentId),
        until: formatters.date(classified.until),
      });
  }
}
