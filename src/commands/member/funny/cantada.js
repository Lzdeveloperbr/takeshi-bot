import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { CANTADAS } from "../../../data/diversao.js";
import { onlyNumbers } from "../../../utils/index.js";
import { resolveTarget } from "../../../utils/mentions.js";

export default {
  name: "cantada",
  description: "Manda uma cantada (marque alguém ou responda a uma mensagem).",
  commands: ["cantada", "cantadas", "xaveco"],
  usage: `${PREFIX}cantada @pessoa`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, isReply, replyLid, userLid, webMessage, sendText, sendReact }) => {
    const target = resolveTarget({ webMessage, fullArgs, isReply, replyLid, userLid });
    const line = CANTADAS[randomInt(CANTADAS.length)];

    await sendReact("😏");

    if (target && onlyNumbers(target)) {
      await sendText(`😏 @${onlyNumbers(userLid)} para @${onlyNumbers(target)}:\n\n_"${line}"_`, [userLid, target]);
    } else {
      await sendText(`😏 _"${line}"_`);
    }
  },
};
