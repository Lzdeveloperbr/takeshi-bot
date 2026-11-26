import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { DESAFIOS, VERDADES } from "../../../data/diversao.js";

const pick = (list) => list[randomInt(list.length)];

export default {
  name: "verdade-ou-desafio",
  description: "Verdade ou desafio! Escolha um ou deixe o bot sortear.",
  commands: ["vd", "verdade-ou-desafio", "verdade", "desafio"],
  usage: `${PREFIX}vd (ou ${PREFIX}verdade / ${PREFIX}desafio)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ commandName, args, webMessage, sendReply, sendReact }) => {
    const choice = (args[0] || "").toLowerCase();
    const wantsTruth = commandName === "verdade" || choice.startsWith("v");
    const wantsDare = commandName === "desafio" || choice.startsWith("d");
    const isTruth = wantsTruth ? true : wantsDare ? false : randomInt(2) === 0;

    const name = webMessage?.pushName || "Você";

    await sendReact(isTruth ? "🤔" : "🔥");
    await sendReply(
      isTruth
        ? `🤔 *VERDADE* para ${name}:\n\n${pick(VERDADES)}`
        : `🔥 *DESAFIO* para ${name}:\n\n${pick(DESAFIOS)}`,
    );
  },
};
