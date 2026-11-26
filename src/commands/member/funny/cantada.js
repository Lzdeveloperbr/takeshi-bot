import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { CANTADAS } from "../../../data/diversao.js";
import { onlyNumbers } from "../../../utils/index.js";

export default {
  name: "cantada",
  description: "Manda uma cantada (marque alguém ou responda a uma mensagem).",
  commands: ["cantada", "cantadas", "xaveco"],
  usage: `${PREFIX}cantada @pessoa`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, isReply, replyLid, userLid, sendText, sendReact }) => {
    const target = isReply && replyLid ? replyLid : args[0] ? `${onlyNumbers(args[0])}@lid` : null;
    const line = CANTADAS[randomInt(CANTADAS.length)];

    await sendReact("😏");

    if (target && onlyNumbers(target)) {
      await sendText(`😏 @${onlyNumbers(userLid)} para @${onlyNumbers(target)}:\n\n_"${line}"_`, [userLid, target]);
    } else {
      await sendText(`😏 _"${line}"_`);
    }
  },
};
