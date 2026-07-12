import {
  DEFAULT_PLAYER_LANGUAGE,
  type PlayerLanguage,
} from "./language";

export function playerLanguageFromHeader(
  value: string | undefined,
  fallback: PlayerLanguage = DEFAULT_PLAYER_LANGUAGE,
): PlayerLanguage {
  let selected = fallback;
  let selectedQuality = -1;

  for (const entry of value?.split(",") ?? []) {
    const [rawTag, ...parameters] = entry.split(";");
    const tag = rawTag?.trim().toLowerCase();
    const qualityParameter = parameters
      .map((parameter) => parameter.trim().toLowerCase())
      .find((parameter) => parameter.startsWith("q="));
    const parsedQuality = qualityParameter
      ? Number(qualityParameter.slice(2))
      : 1;
    const quality = Number.isFinite(parsedQuality) ? parsedQuality : 0;
    const language = tag === "pt" || tag?.startsWith("pt-")
      ? "pt-BR"
      : tag === "en" || tag?.startsWith("en-")
        ? "en"
        : null;

    if (language && quality > 0 && quality > selectedQuality) {
      selected = language;
      selectedQuality = quality;
    }
  }

  return selected;
}
