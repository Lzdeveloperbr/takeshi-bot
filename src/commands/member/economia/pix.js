import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { formatCoins, getBalance, transferCoins } from "../../../utils/economy.js";
import { onlyNumbers } from "../../../utils/index.js";
import { resolveTarget } from "../../../utils/mentions.js";

export default {
  name: "pix",
  description: "Transfere moedas do bot para outro membro (moedas do jogo, não dinheiro de verdade).",
  commands: ["pix", "transferir", "doar"],
  usage: `${PREFIX}pix @pessoa 100  (ou responda a alguém com ${PREFIX}pix 100)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, userLid, fullArgs, isReply, replyLid, webMessage, sendText }) => {
    if (!isGroup) {
      throw new WarningError("A economia funciona dentro dos grupos.");
    }

    // Destinatário: quem foi marcado (ou respondido). O valor é o número que
    // sobra no texto depois de tirar as menções "@número".
    const target = resolveTarget({ webMessage, fullArgs, isReply, replyLid, userLid });
    const amountText = fullArgs.replace(/@\d+/g, " ").match(/\b\d+\b/)?.[0];
    const amount = Number.parseInt(amountText, 10);

    if (!target || !Number.isInteger(amount) || amount < 1) {
      throw new InvalidParameterError(`Use: ${PREFIX}pix @pessoa 100`);
    }

    if (target === userLid) {
      throw new WarningError("Você não pode transferir para você mesmo!");
    }

    const result = transferCoins(remoteJid, userLid, target, amount);

    if (!result.ok) {
      throw new WarningError(`Saldo insuficiente! Você tem ${formatCoins(getBalance(remoteJid, userLid))}.`);
    }

    await sendText(
      `✅ @${onlyNumbers(userLid)} enviou *${formatCoins(amount)}* para @${onlyNumbers(target)}!\n👛 Seu saldo: ${formatCoins(result.balance)}\n\n_Moedas do jogo do bot, não é dinheiro de verdade._`,
      [userLid, target],
    );
  },
};
