import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { cryptoPrices } from "../../../services/extra-apis.js";

const COINS = {
  bitcoin: ["₿ Bitcoin", "btc"],
  ethereum: ["Ξ Ethereum", "eth"],
  solana: ["◎ Solana", "sol"],
  binancecoin: ["🟡 BNB", "bnb"],
  ripple: ["✕ XRP", "xrp"],
  dogecoin: ["🐕 Dogecoin", "doge"],
  tether: ["💵 Tether", "usdt"],
};

const SYMBOLS = Object.fromEntries(Object.entries(COINS).map(([id, [, symbol]]) => [symbol, id]));

const money = (value, currency) =>
  Number(value).toLocaleString(currency === "brl" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: value < 1 ? 6 : 2,
  });

export default {
  name: "cripto",
  description: "Preço das principais criptomoedas (ou de uma específica).",
  commands: ["cripto", "crypto", "bitcoin", "btc"],
  usage: `${PREFIX}cripto  |  ${PREFIX}cripto eth`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendWaitReact, sendSuccessReact }) => {
    const requested = (args[0] || "").toLowerCase().trim();
    const id = SYMBOLS[requested] || (COINS[requested] ? requested : null);
    const ids = id ? [id] : Object.keys(COINS);

    await sendWaitReact();
    const data = await cryptoPrices(ids);

    const lines = ids
      .filter((coin) => data?.[coin])
      .map((coin) => {
        const { brl, usd, brl_24h_change: change } = data[coin];
        const arrow = change > 0 ? "📈" : change < 0 ? "📉" : "➖";
        return `${COINS[coin][0]}: *${money(brl, "brl")}* (${money(usd, "usd")}) ${arrow} ${change > 0 ? "+" : ""}${Number(change || 0).toFixed(2)}%`;
      });

    if (!lines.length) {
      throw new WarningError("Não consegui obter os preços agora.");
    }

    await sendSuccessReact();
    await sendReply(`🪙 *Criptomoedas agora*\n\n${lines.join("\n")}\n\n_Variação nas últimas 24h. Fonte: CoinGecko._`);
  },
};
