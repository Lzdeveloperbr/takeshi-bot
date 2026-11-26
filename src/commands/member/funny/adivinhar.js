import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { getPrefix } from "../../../utils/database.js";
import { getGame, startGame } from "../../../utils/games.js";

export default {
  name: "adivinhar",
  description: "O bot pensa em um número de 1 a 100: quem acertar primeiro ganha 3 pontos!",
  commands: ["adivinhar", "adivinha", "advinhar"],
  usage: `${PREFIX}adivinhar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, sendReply, sendReact }) => {
    const prefix = getPrefix(remoteJid);

    if (getGame(remoteJid, "adivinhar")) {
      await sendReply(`🔢 Já tem um jogo valendo! Chute com *${prefix}chute número*`);
      return;
    }

    startGame(remoteJid, "adivinhar", { number: randomInt(1, 101), attempts: 0 });

    await sendReact("🔢");
    await sendReply(
      `🔢 *ADIVINHE O NÚMERO*\n\nPensei em um número de *1 a 100*.\nChute com *${prefix}chute número* (ex.: ${prefix}chute 50).\nQuem acertar ganha *3 pontos*!`,
    );
  },
};
