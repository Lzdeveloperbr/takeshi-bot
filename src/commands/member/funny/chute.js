import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { getPrefix } from "../../../utils/database.js";
import { addPoint, endGame, getGame } from "../../../utils/games.js";
import { onlyNumbers } from "../../../utils/index.js";

export default {
  name: "chute",
  description: "Chuta um número no jogo adivinhar.",
  commands: ["chute", "chutar"],
  usage: `${PREFIX}chute 50`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, remoteJid, userLid, sendReply, sendText, sendReact }) => {
    const game = getGame(remoteJid, "adivinhar");

    if (!game) {
      throw new WarningError(`Não tem jogo valendo. Comece com ${getPrefix(remoteJid)}adivinhar`);
    }

    const guess = Number.parseInt(args[0], 10);

    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      throw new InvalidParameterError("Chute um número de 1 a 100!");
    }

    game.attempts++;

    if (guess < game.number) {
      await sendReact("⬆️");
      await sendReply(`⬆️ É *maior* que ${guess}!`);
      return;
    }

    if (guess > game.number) {
      await sendReact("⬇️");
      await sendReply(`⬇️ É *menor* que ${guess}!`);
      return;
    }

    endGame(remoteJid, "adivinhar");
    const points = addPoint(remoteJid, userLid, 3);

    await sendReact("🎉");
    await sendText(
      `🎉 @${onlyNumbers(userLid)} acertou! O número era *${game.number}* (${game.attempts} chute(s) no total).\n🏅 Pontos: *${points}*`,
      [userLid],
    );
  },
};
