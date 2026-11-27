import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { formatCoins, getBalance, getRichest } from "../../../utils/economy.js";
import { onlyNumbers } from "../../../utils/index.js";

export default {
  name: "carteira",
  description: "Mostra suas moedas (ou as de quem você marcar/responder).",
  commands: ["carteira", "saldo-moedas", "wallet", "bal"],
  usage: `${PREFIX}carteira (ou ${PREFIX}carteira @pessoa)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, args, isReply, replyLid, sendText }) => {
    if (!isGroup) {
      throw new WarningError("A economia funciona dentro dos grupos.");
    }

    const target = isReply && replyLid ? replyLid : args[0] && onlyNumbers(args[0]) ? `${onlyNumbers(args[0])}@lid` : userLid;
    const balance = getBalance(remoteJid, target);
    const position = getRichest(remoteJid, 1000).findIndex(([id]) => id === target);

    await sendText(
      `👛 *Carteira de @${onlyNumbers(target)}*\n\n${formatCoins(balance)}${position >= 0 ? `\n🏆 ${position + 1}º mais rico do grupo` : ""}\n\nGanhe moedas com ${PREFIX}diario, ${PREFIX}quiz, ${PREFIX}adivinhar e ${PREFIX}forca.`,
      [target],
    );
  },
};
