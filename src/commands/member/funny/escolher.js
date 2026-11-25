import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "escolher",
  description: "O bot escolhe uma das opções para você.",
  commands: ["escolher", "escolha", "choose"],
  usage: `${PREFIX}escolher pizza | hambúrguer | sushi`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendReact }) => {
    const options = args.map((option) => option.trim()).filter(Boolean);

    if (options.length < 2) {
      throw new InvalidParameterError(
        `Informe pelo menos 2 opções separadas por | \nExemplo: ${PREFIX}escolher pizza | hambúrguer | sushi`,
      );
    }

    const choice = options[randomInt(options.length)];

    await sendReact("🤔");
    await sendReply(`🤔 Entre ${options.length} opções, eu escolho... *${choice}*!`);
  },
};
