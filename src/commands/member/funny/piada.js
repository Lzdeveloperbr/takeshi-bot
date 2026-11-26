import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { PIADAS } from "../../../data/diversao.js";

export default {
  name: "piada",
  description: "Conta uma piada.",
  commands: ["piada", "piadas", "joke"],
  usage: `${PREFIX}piada`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply, sendReact }) => {
    await sendReact("😂");
    await sendReply(`😂 ${PIADAS[randomInt(PIADAS.length)]}`);
  },
};
