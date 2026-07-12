import type { CrewArchetypeId } from "../../../shared/crew";
import type { PlayerLanguage } from "../../../shared/language";

const FALLBACK_BIOS: Record<
  PlayerLanguage,
  Record<CrewArchetypeId, readonly string[]>
> = {
  en: {
    enforcer: [
      "Broke knuckles for three different families and never once raised his voice.",
      "Used to collect for the docks union. The docks union paid on time.",
    ],
    face: [
      "Talked his way out of two indictments and into every club in town.",
      "Sold a judge his own stolen watch back. The judge tipped.",
    ],
    fixer: [
      "Knows which desk at city hall loses paperwork for a hundred.",
      "Has a cousin in every records office between here and the river.",
    ],
    ghost: [
      "Three burglary charges, zero convictions, no photographs known to exist.",
      "Once walked out of a locked evidence room with the lock.",
    ],
    mastermind: [
      "Plans jobs on butcher paper and burns it before the coffee cools.",
      "Counts cards, counts exits, counts on nobody.",
    ],
    underboss: [
      "Ran a six-man crew through the last war without losing a soldier.",
      "Soldiers stand straighter when he walks the room.",
    ],
    wirehead: [
      "Opened his first safe at eleven. It was his father's. They still talk.",
      "Can wire a bypass faster than the alarm company can dial.",
    ],
  },
  "pt-BR": {
    enforcer: [
      "Quebrou ossos para três famílias diferentes e nunca precisou levantar a voz.",
      "Fazia cobranças para o sindicato das docas. O sindicato pagava em dia.",
    ],
    face: [
      "Escapou de duas acusações na conversa e entrou em todos os clubes da cidade.",
      "Vendeu a um juiz o próprio relógio roubado. O juiz ainda deu gorjeta.",
    ],
    fixer: [
      "Sabe qual mesa da prefeitura faz um processo sumir por cem dólares.",
      "Tem um primo em cada cartório daqui até o rio.",
    ],
    ghost: [
      "Três acusações de invasão, nenhuma condenação e nenhuma foto conhecida.",
      "Certa vez saiu de uma sala de provas trancada levando até a fechadura.",
    ],
    mastermind: [
      "Planeja golpes em papel de açougue e queima tudo antes do café esfriar.",
      "Conta cartas, conta saídas e não conta com ninguém.",
    ],
    underboss: [
      "Comandou seis homens durante a última guerra sem perder um soldado.",
      "Os soldados endireitam a postura quando ele entra na sala.",
    ],
    wirehead: [
      "Abriu o primeiro cofre aos onze anos. Era do pai. Eles ainda se falam.",
      "Faz uma ponte nos fios antes que a central de alarme consiga discar.",
    ],
  },
};

export function getCrewFallbackBios(
  language: PlayerLanguage,
  archetype: CrewArchetypeId,
): readonly string[] {
  return FALLBACK_BIOS[language][archetype];
}
