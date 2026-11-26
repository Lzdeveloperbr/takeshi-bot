import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { EU_NUNCA } from "../../../data/diversao.js";

export default {
  name: "eu-nunca",
  description: "Jogo do \"eu nunca\": quem já fez, responde com 🍺!",
  commands: ["eu-nunca", "eununca", "nunca"],
  usage: `${PREFIX}eu-nunca`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendText, sendReact }) => {
    await sendReact("🙈");
    await sendText(`🙈 *${EU_NUNCA[randomInt(EU_NUNCA.length)]}*\n\nQuem já fez, responde com 🍺`);
  },
};
