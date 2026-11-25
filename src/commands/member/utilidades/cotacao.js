import axios from "axios";
import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";

const PAIRS = [
  { code: "USD-BRL", key: "USDBRL", label: "💵 Dólar" },
  { code: "EUR-BRL", key: "EURBRL", label: "💶 Euro" },
  { code: "GBP-BRL", key: "GBPBRL", label: "💷 Libra" },
  { code: "BTC-BRL", key: "BTCBRL", label: "₿ Bitcoin" },
];

const brl = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default {
  name: "cotacao",
  description: "Mostra a cotação atual do dólar, euro, libra e bitcoin em reais.",
  commands: ["cotacao", "cotação", "dolar", "dólar", "moedas"],
  usage: `${PREFIX}cotacao`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendWaitReact, sendSuccessReact }) => {
    await sendWaitReact();

    let data;
    try {
      ({ data } = await axios.get(
        `https://economia.awesomeapi.com.br/json/last/${PAIRS.map((p) => p.code).join(",")}`,
        { timeout: 15_000 },
      ));
    } catch {
      throw new WarningError("Não consegui consultar as cotações agora. Tente novamente em instantes.");
    }

    const lines = PAIRS.filter(({ key }) => data?.[key]).map(({ key, label }) => {
      const { bid, pctChange } = data[key];
      const change = Number(pctChange);
      const arrow = change > 0 ? "📈" : change < 0 ? "📉" : "➖";
      return `${label}: *${brl(bid)}* ${arrow} ${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
    });

    if (!lines.length) {
      throw new WarningError("Não consegui obter as cotações agora.");
    }

    await sendSuccessReact();
    await sendReply(`💱 *Cotações agora*\n\n${lines.join("\n")}\n\n_Variação em relação ao fechamento anterior._`);
  },
};
