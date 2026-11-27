import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { formatCoins, getRichest } from "../../../utils/economy.js";
import { onlyNumbers } from "../../../utils/index.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  name: "ricos",
  description: "Ranking dos membros com mais moedas.",
  commands: ["ricos", "top-ricos", "ranking-moedas", "milionarios"],
  usage: `${PREFIX}ricos`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("A economia funciona dentro dos grupos.");
    }

    const richest = getRichest(remoteJid);

    if (!richest.length) {
      throw new WarningError(`Ninguém tem moedas ainda! Comece com ${PREFIX}diario`);
    }

    await sendReact("💎");
    await sendText(
      `💎 *MAIS RICOS DO GRUPO*\n\n${richest
        .map(([id, coins], i) => `${MEDALS[i] || `${i + 1}º`} @${onlyNumbers(id)} — ${formatCoins(coins)}`)
        .join("\n")}`,
      richest.map(([id]) => id),
    );
  },
};
