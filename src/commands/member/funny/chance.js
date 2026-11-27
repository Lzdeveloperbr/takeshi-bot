import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "chance",
  description: "O bot diz qual a chance de algo acontecer.",
  commands: ["chance", "probabilidade"],
  usage: `${PREFIX}chance de eu ficar rico`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const what = fullArgs?.trim();

    if (!what) {
      throw new InvalidParameterError(`Diga o quê! Exemplo: ${PREFIX}chance de chover amanhã`);
    }

    const percent = randomInt(0, 101);
    const emoji = percent >= 80 ? "🤩" : percent >= 50 ? "🙂" : percent >= 20 ? "😬" : "💀";

    await sendReact(emoji);
    await sendReply(`🎯 A chance ${/^de\b/i.test(what) ? what : `de ${what}`} é de *${percent}%* ${emoji}`);
  },
};
