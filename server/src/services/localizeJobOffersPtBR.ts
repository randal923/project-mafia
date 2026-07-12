import { districtIdForLabel, type DistrictId } from "../../../shared/district";
import type { JobOffer } from "../../../shared/job";

const DISTRICT_LOCATIONS: Record<DistrictId, string> = {
  downtown: "no Centro",
  hillcrest: "em Hillcrest",
  ironworks: "no Distrito Industrial",
  neon_strip: "na Faixa de Neon",
  old_quarter: "no Bairro Antigo",
  riverside: "na Beira-Rio",
  the_docks: "nas Docas",
};

const GEAR_NAMES: Record<string, string> = {
  breaching: "equipamento de arrombamento",
  climbing: "equipamento de escalada",
  crowbar: "pé de cabra",
  disguise: "disfarce",
  explosive: "explosivos",
  flashbang: "granada de luz",
  getaway: "veículo de fuga",
  hacking: "equipamento de invasão",
  jammer: "bloqueador de sinal",
  lockpick: "gazuas",
  scanner: "rádio scanner",
  smoke: "cortina de fumaça",
};

const PREMISES: Record<string, string> = {
  ambush: "Uma carga valiosa vai passar pela área e há uma chance de interceptá-la.",
  collection: "Uma dívida vencida precisa ser cobrada antes que o devedor desapareça.",
  heist: "Um alvo bem protegido guarda dinheiro suficiente para justificar o risco.",
  hijack: "Uma remessa valiosa pode ser desviada antes de chegar ao destino.",
  infiltration: "Há algo valioso atrás de portas vigiadas, e entrar sem alarde é a melhor saída.",
  lay_low: "Um contato oferece abrigo e um caminho discreto para aliviar a pressão policial.",
  racket: "Um esquema local está rendendo dinheiro para a pessoa errada.",
  robbery: "Um alvo com dinheiro em caixa ficou vulnerável por pouco tempo.",
  shakedown: "Alguém na área precisa de um lembrete sobre quem dita as regras.",
  takedown: "Um rival importante ficará exposto por uma janela curta.",
  takeover: "Um negócio lucrativo pode mudar de mãos esta noite.",
  theft: "Uma mercadoria valiosa está ao alcance de quem agir primeiro.",
  turf_takeover: "Um quarteirão sem dono está pronto para receber a bandeira da família.",
};

export function localizeJobOffersPtBR(offers: JobOffer[]): JobOffer[] {
  return offers.map((offer) => {
    const { gear, ...offerWithoutGear } = offer;
    const districtId = districtIdForLabel(offer.district);
    const district = districtId ? DISTRICT_LOCATIONS[districtId] : "na cidade";

    return {
      ...offerWithoutGear,
      ...(gear && {
        gear: gear.map((entry) => ({
          ...entry,
          label:
            entry.tags.map((tag) => GEAR_NAMES[tag]).find(Boolean) ??
            "equipamento especial",
        })),
      }),
      storySeed: {
        location: `Um ponto ${district}`,
        premise:
          PREMISES[offer.type] ??
          "Um contato apresentou um trabalho que precisa ser resolvido hoje.",
        pressure:
          "A oportunidade dura pouco, e qualquer demora aumenta o risco.",
      },
    };
  });
}
