import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { getRates } from "../../../services/brasil-api.js";

const ICONS = { Selic: "🏛️", CDI: "🏦", IPCA: "📈" };

export default {
  name: "taxas",
  description: "Mostra as taxas Selic, CDI e IPCA atuais.",
  commands: ["taxas", "selic", "cdi", "ipca"],
  usage: `${PREFIX}taxas`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendWaitReact, sendSuccessReact }) => {
    await sendWaitReact();
    const rates = await getRates();

    if (!Array.isArray(rates) || !rates.length) {
      throw new WarningError("Não encontrei as taxas agora.");
    }

    const lines = rates.map(
      ({ nome, valor }) =>
        `${ICONS[nome] || "▢"} *${nome}*: ${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ao ano`,
    );

    await sendSuccessReact();
    await sendReply(`💹 *Taxas atuais*\n\n${lines.join("\n")}\n\n_Fonte: Banco Central / IBGE via BrasilAPI._`);
  },
};
