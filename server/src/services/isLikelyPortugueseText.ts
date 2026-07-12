const PORTUGUESE_WORDS = new Set([
  "ao",
  "aos",
  "cidade",
  "com",
  "da",
  "das",
  "de",
  "depois",
  "dinheiro",
  "do",
  "dos",
  "em",
  "entre",
  "está",
  "família",
  "foi",
  "mais",
  "na",
  "nas",
  "não",
  "no",
  "nos",
  "para",
  "pela",
  "pelo",
  "polícia",
  "por",
  "que",
  "risco",
  "sem",
  "seu",
  "sua",
  "território",
  "trabalho",
  "um",
  "uma",
]);

const ENGLISH_WORDS = new Set([
  "after",
  "and",
  "are",
  "before",
  "city",
  "family",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "job",
  "money",
  "of",
  "on",
  "police",
  "risk",
  "target",
  "territory",
  "that",
  "the",
  "to",
  "was",
  "were",
  "with",
]);

export function isLikelyPortugueseText(value: unknown): boolean {
  const strings: string[] = [];

  const collectStrings = (candidate: unknown): void => {
    if (typeof candidate === "string") {
      strings.push(candidate);
      return;
    }
    if (!candidate || typeof candidate !== "object") {
      return;
    }
    Object.values(candidate).forEach(collectStrings);
  };

  collectStrings(value);
  const words =
    strings
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .match(/\p{L}+/gu) ?? [];
  const portugueseScore = words.reduce(
    (score, word) =>
      score +
      (PORTUGUESE_WORDS.has(word) ? 1 : 0) +
      (/[áàâãçéêíóôõú]/u.test(word) ? 1 : 0),
    0,
  );
  const englishScore = words.reduce(
    (score, word) => score + (ENGLISH_WORDS.has(word) ? 1 : 0),
    0,
  );

  return portugueseScore >= 2 && portugueseScore > englishScore;
}
