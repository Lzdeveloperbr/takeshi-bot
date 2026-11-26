import { PREFIX } from "../../../config.js";
import { WarningError } from "../../../errors/index.js";
import { getScores } from "../../../utils/games.js";
import { onlyNumbers } from "../../../utils/index.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  name: "placar",
  description: "Mostra o placar dos jogos (quiz e adivinhar).",
  commands: ["placar", "pontos", "score"],
  usage: `${PREFIX}placar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, sendText, sendReact }) => {
    const scores = getScores(remoteJid).slice(0, 10);

    if (!scores.length) {
      throw new WarningError(`Ninguém pontuou ainda! Jogue com ${PREFIX}quiz ou ${PREFIX}adivinhar`);
    }

    await sendReact("🏅");
    await sendText(
      `🏅 *PLACAR DOS JOGOS*\n\n${scores
        .map(([id, points], i) => `${MEDALS[i] || `${i + 1}º`} @${onlyNumbers(id)} — *${points}* pt`)
        .join("\n")}\n\n_O placar zera quando o bot reinicia._`,
      scores.map(([id]) => id),
    );
  },
};
