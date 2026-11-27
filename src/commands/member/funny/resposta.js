import { PREFIX } from "../../../config.js";
import { InvalidParameterError, WarningError } from "../../../errors/index.js";
import { getPrefix } from "../../../utils/database.js";
import { addCoins, formatCoins } from "../../../utils/economy.js";
import { addPoint, endGame, getGame } from "../../../utils/games.js";
import { onlyNumbers } from "../../../utils/index.js";
import { LETTERS } from "./quiz.js";

export default {
  name: "resposta",
  description: "Responde a pergunta do quiz.",
  commands: ["r", "resposta", "responder"],
  usage: `${PREFIX}r A`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, remoteJid, userLid, sendText, sendReact }) => {
    const game = getGame(remoteJid, "quiz");

    if (!game) {
      throw new WarningError(`Não tem quiz valendo agora. Comece um com ${getPrefix(remoteJid)}quiz`);
    }

    const index = LETTERS.indexOf((args[0] || "").trim().toUpperCase());

    if (index === -1 || index >= game.options.length) {
      throw new InvalidParameterError(`Responda com uma letra: ${LETTERS.slice(0, game.options.length).join(", ")}`);
    }

    if (game.wrong.has(userLid)) {
      throw new WarningError("Você já errou essa! Deixe os outros tentarem 😅");
    }

    const tag = `@${onlyNumbers(userLid)}`;

    if (index !== game.correct) {
      game.wrong.add(userLid);
      await sendReact("❌");
      return;
    }

    endGame(remoteJid, "quiz");
    const points = addPoint(remoteJid, userLid);
    addCoins(remoteJid, userLid, 50);

    await sendReact("✅");
    await sendText(
      `✅ ${tag} acertou! A resposta era *${LETTERS[game.correct]}) ${game.options[game.correct]}*\n🏅 Pontos: *${points}* | 💰 +${formatCoins(50)}\n\nVeja o ranking com ${getPrefix(remoteJid)}placar`,
      [userLid],
    );
  },
};
