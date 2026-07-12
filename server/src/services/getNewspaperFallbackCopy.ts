import type { PlayerLanguage } from "../../../shared/language";
import {
  MAX_ARTICLES_PER_EDITION,
  type NewspaperArticle,
  type NewspaperCopy,
  type NewspaperSection,
  type WorldEvent,
  type WorldEventType,
} from "../../../shared/newspaper";

const SECTION_BY_EVENT_TYPE: Record<WorldEventType, NewspaperSection> = {
  battle: "war_report",
  building_raided: "crime_blotter",
  crackdown: "crime_blotter",
  crew_rat: "crime_blotter",
  landmark_captured: "war_report",
  season_end: "season",
  stronghold_countdown: "season",
  stronghold_countdown_broken: "season",
  turf_captured: "war_report",
  turf_claimed: "war_report",
};

function portugueseArticle(event: WorldEvent): NewspaperArticle {
  const actor = event.actorName;
  const target = event.targetName;
  const section = SECTION_BY_EVENT_TYPE[event.type];

  switch (event.type) {
    case "battle":
      return {
        body:
          actor && target
            ? `A família ${actor} avançou contra a família ${target}, mas os defensores mantiveram o território.`
            : "Duas famílias se enfrentaram por território, mas as defesas impediram a tomada.",
        section,
        title: actor
          ? `${actor} encontra resistência nas ruas`
          : "Ataque encontra resistência nas ruas",
      };
    case "building_raided":
      return {
        body: "Uma operação policial atingiu um negócio ligado ao submundo depois de dias sob vigilância.",
        section,
        title: "Polícia fecha o cerco a um negócio",
      };
    case "crackdown":
      return {
        body: target
          ? `A prefeitura anunciou uma repressão contra a família ${target} depois de uma semana de violência aberta.`
          : "A prefeitura anunciou uma nova repressão depois de uma semana de violência aberta.",
        section,
        title: target
          ? `Prefeitura mira a família ${target}`
          : "Prefeitura anuncia nova repressão",
      };
    case "crew_rat":
      return {
        body: target
          ? `Informações entregues à polícia aumentaram a pressão sobre a família ${target}.`
          : "Informações de dentro do submundo chegaram às mãos da polícia.",
        section,
        title: "Informante procura a polícia",
      };
    case "landmark_captured":
      return {
        body: actor
          ? `A família ${actor} assumiu o controle de um ponto estratégico da cidade.`
          : "Uma família assumiu o controle de um ponto estratégico da cidade.",
        section,
        title: actor
          ? `${actor} toma um ponto estratégico`
          : "Ponto estratégico muda de mãos",
      };
    case "season_end":
      return {
        body: actor
          ? `A família ${actor} terminou a temporada no topo e ficou com a coroa da cidade.`
          : "A temporada terminou sem que uma família assumisse o comando da cidade.",
        section,
        title: actor
          ? `${actor} encerra a temporada no topo`
          : "Temporada termina sem novo reinado",
      };
    case "stronghold_countdown":
      return {
        body: actor
          ? `A disputa pelo controle total da cidade entrou em uma nova fase em torno da família ${actor}.`
          : "A disputa pelo controle total da cidade entrou em uma nova fase.",
        section,
        title: "Controle da cidade entra em nova fase",
      };
    case "stronghold_countdown_broken":
      return {
        body: actor
          ? `A família ${actor} perdeu o controle total da cidade, e o relógio da conquista foi interrompido.`
          : "Nenhuma família mantém o controle total da cidade, e o relógio da conquista foi interrompido.",
        section,
        title: "Relógio da conquista é interrompido",
      };
    case "turf_captured":
      return {
        body:
          actor && target
            ? `A família ${actor} tomou um território que estava nas mãos da família ${target}.`
            : actor
              ? `A família ${actor} tomou um novo território.`
              : "Um território da cidade mudou de mãos.",
        section,
        title: actor
          ? `${actor} amplia seu território`
          : "Território muda de mãos",
      };
    case "turf_claimed":
      return {
        body: actor
          ? `A família ${actor} reivindicou um território que ainda não tinha dono.`
          : "Uma família reivindicou um território que ainda não tinha dono.",
        section,
        title: actor
          ? `${actor} finca sua bandeira`
          : "Nova bandeira surge nas ruas",
      };
  }
}

function articleForEvent(
  event: WorldEvent,
  language: PlayerLanguage,
): NewspaperArticle {
  if (language === "pt-BR") {
    return portugueseArticle(event);
  }

  return {
    body: event.summary,
    section: SECTION_BY_EVENT_TYPE[event.type],
    title: event.summary.slice(0, 80),
  };
}

export function getNewspaperFallbackCopy(
  stories: WorldEvent[],
  language: PlayerLanguage,
): NewspaperCopy {
  const [first, ...rest] = stories;
  if (!first) {
    return language === "pt-BR"
      ? {
          articles: [],
          headline: {
            body: "Fontes relatam uma calma incomum nos bairros da cidade. Ninguém acredita que vá durar.",
            section: "front_page",
            title: "Uma noite tranquila na cidade",
          },
        }
      : {
          articles: [],
          headline: {
            body: "Sources report an unusual calm across the city's districts. Nobody believes it will last.",
            section: "front_page",
            title: "A quiet night in the city",
          },
        };
  }

  const headline = articleForEvent(first, language);
  return {
    articles: rest
      .slice(0, MAX_ARTICLES_PER_EDITION - 1)
      .map((event) => articleForEvent(event, language)),
    headline: { ...headline, section: "front_page" },
  };
}
