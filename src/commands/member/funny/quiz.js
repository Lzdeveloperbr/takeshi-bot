import { randomInt } from "node:crypto";
import { BOT_NAME, PREFIX } from "../../../config.js";
import { QUIZ } from "../../../data/diversao.js";
import { getPrefix } from "../../../utils/database.js";
import { getGame, startGame } from "../../../utils/games.js";
import { quickReply, sendButtons } from "../../../utils/buttons.js";
import { errorLog } from "../../../utils/logger.js";

export const LETTERS = ["A", "B", "C", "D"];

export default {
  name: "quiz",
  description: "Pergunta de conhecimentos gerais: quem acertar primeiro ganha ponto!",
  commands: ["quiz", "pergunta-quiz", "trivia"],
  usage: `${PREFIX}quiz`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, socket, sendReply, sendReact }) => {
    const prefix = getPrefix(remoteJid);
    const current = getGame(remoteJid, "quiz");

    if (current) {
      await sendReply(`❓ Ainda tem uma pergunta valendo!\n\n${current.text}`);
      return;
    }

    const [question, options, correct] = QUIZ[randomInt(QUIZ.length)];
    const text = `🧠 *QUIZ*\n\n${question}\n\n${options
      .map((option, i) => `*${LETTERS[i]})* ${option}`)
      .join("\n")}\n\nResponda com *${prefix}r letra* (ex.: ${prefix}r A). Vale 1 ponto!`;

    startGame(remoteJid, "quiz", { correct, options, text, wrong: new Set() });

    await sendReact("🧠");
    await sendReply(text);

    try {
      await sendButtons({
        socket,
        remoteJid,
        text: "Toque na resposta:",
        footer: BOT_NAME,
        buttons: options.map((option, i) => quickReply(`${LETTERS[i]}) ${option}`.slice(0, 20), `${prefix}r ${LETTERS[i]}`)),
      });
    } catch (error) {
      errorLog(`Não consegui enviar os botões do quiz: ${error.message}`);
    }
  },
};
