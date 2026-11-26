import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { CURIOSIDADES } from "../../../data/diversao.js";

export default {
  name: "curiosidade",
  description: "Conta uma curiosidade aleatória.",
  commands: ["curiosidade", "fato", "voce-sabia", "vocesabia"],
  usage: `${PREFIX}curiosidade`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact }) => {
    await sendReact("🧠");
    await sendReply(`🧠 *Você sabia?*\n\n${CURIOSIDADES[randomInt(CURIOSIDADES.length)]}`);
  },
};
