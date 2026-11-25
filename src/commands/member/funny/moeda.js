import { delay } from "baileys";
import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";

export default {
  name: "moeda",
  description: "Joga uma moeda: cara ou coroa?",
  commands: ["moeda", "cara-ou-coroa", "coinflip"],
  usage: `${PREFIX}moeda`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact, webMessage }) => {
    await sendReact("🪙");
    await delay(1000);

    const result = randomInt(2) === 0 ? "CARA 🗿" : "COROA 👑";
    const name = webMessage?.pushName || "Você";

    await sendReply(`🪙 ${name} jogou a moeda e deu... *${result}*!`);
  },
};
