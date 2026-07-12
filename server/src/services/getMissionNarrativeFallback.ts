import type {
  JobOffer,
  MissionNode,
  NodeNarrative,
  OutcomeTier,
} from "../../../shared/job";
import type { PlayerLanguage } from "../../../shared/language";

type OutcomeCopy = {
  body: string;
  summary: string;
  title: string;
};

const ENGLISH_OUTCOMES: Record<OutcomeTier, OutcomeCopy> = {
  disaster: {
    body: "The police close in before the crew can get clear. The job ends in custody.",
    summary: "ended with the crew in police custody",
    title: "The police close in",
  },
  failure: {
    body: "The plan falls apart and the crew abandons the job before the damage gets worse.",
    summary: "ended without a payoff",
    title: "The plan falls apart",
  },
  jackpot: {
    body: "Every part of the plan lands cleanly, and the crew leaves with more than expected.",
    summary: "ended with a payoff beyond expectations",
    title: "A perfect score",
  },
  partial_failure: {
    body: "Most of the plan slips away, but the crew salvages what it can before leaving.",
    summary: "ended with only a small part of the plan salvaged",
    title: "A bitter result",
  },
  partially_successful: {
    body: "The crew gets the job done, but the loose ends make the victory costly.",
    summary: "succeeded with costly loose ends",
    title: "A costly success",
  },
  successful: {
    body: "The plan works, and the crew clears the scene with the full take.",
    summary: "ended in a clean success",
    title: "Job complete",
  },
};

const PORTUGUESE_OUTCOMES: Record<OutcomeTier, OutcomeCopy> = {
  disaster: {
    body: "A polícia fecha o cerco antes que a equipe consiga escapar. O trabalho termina na prisão.",
    summary: "terminou com a equipe sob custódia da polícia",
    title: "A polícia fecha o cerco",
  },
  failure: {
    body: "O plano desmorona, e a equipe abandona o trabalho antes que o prejuízo aumente.",
    summary: "terminou sem recompensa",
    title: "O plano desmorona",
  },
  jackpot: {
    body: "Cada parte do plano funciona, e a equipe sai com mais do que esperava.",
    summary: "terminou com uma recompensa acima do esperado",
    title: "Uma bolada perfeita",
  },
  partial_failure: {
    body: "Quase todo o plano escapa das mãos, mas a equipe salva o que pode antes de partir.",
    summary: "terminou com apenas uma pequena parte do plano salva",
    title: "Um resultado amargo",
  },
  partially_successful: {
    body: "A equipe conclui o trabalho, mas as pontas soltas tornam a vitória cara.",
    summary: "teve sucesso, mas deixou pontas soltas caras",
    title: "Uma vitória cara",
  },
  successful: {
    body: "O plano funciona, e a equipe deixa o local com a recompensa completa.",
    summary: "terminou com um sucesso limpo",
    title: "Trabalho concluído",
  },
};

export function getMissionNarrativeFallback(
  offer: JobOffer,
  node: MissionNode,
  language: PlayerLanguage,
): NodeNarrative {
  if (node.kind === "beat") {
    return language === "pt-BR"
      ? {
          body: `A equipe avança enquanto o plano entra em ação. ${offer.storySeed.premise}`,
          stakes: offer.storySeed.pressure,
          storySummary: null,
          title: "O trabalho avança",
        }
      : {
          body: `The crew advances as the plan goes into motion. ${offer.storySeed.premise}`,
          stakes: offer.storySeed.pressure,
          storySummary: null,
          title: "The job moves forward",
        };
  }

  const tier = node.outcomeTier ?? "partial_failure";
  const copy =
    language === "pt-BR"
      ? PORTUGUESE_OUTCOMES[tier]
      : ENGLISH_OUTCOMES[tier];
  const storySummary =
    language === "pt-BR"
      ? `O trabalho em ${offer.storySeed.location} ${copy.summary}.`
      : `The job at ${offer.storySeed.location} ${copy.summary}.`;

  return {
    body: copy.body,
    stakes: null,
    storySummary,
    title: copy.title,
  };
}
