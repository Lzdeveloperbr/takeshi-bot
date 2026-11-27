import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { claimDaily, formatCoins, formatDuration } from "../../../utils/economy.js";

export default {
  name: "diario",
  description: "Resgata suas moedas diárias (dias seguidos dão bônus).",
  commands: ["diario", "diário", "daily", "resgatar"],
  usage: `${PREFIX}diario`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, sendReply, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("A economia funciona dentro dos grupos.");
    }

    const result = claimDaily(remoteJid, userLid, randomInt(100, 301));

    if (!result.ok) {
      throw new WarningError(`Você já resgatou hoje! Volte em *${formatDuration(result.waitMs)}*.`);
    }

    const streakText =
      result.streak > 1 ? `\n🔥 ${result.streak} dias seguidos (+${Math.min(result.streak - 1, 7) * 10}% de bônus)` : "";

    await sendReact("💰");
    await sendReply(
      `💰 Você resgatou *${formatCoins(result.amount)}*!${streakText}\n\n👛 Saldo: *${formatCoins(result.balance)}*\n\nVolte amanhã para continuar a sequência.`,
    );
  },
};
