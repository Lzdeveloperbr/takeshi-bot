import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "reverso",
  description: "Escreve o texto de trás para frente.",
  commands: ["reverso", "inverter-texto", "contrario"],
  usage: `${PREFIX}reverso seu texto`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply }) => {
    const text = fullArgs?.trim() || replyText?.trim();

    if (!text) {
      throw new InvalidParameterError(`Escreva um texto! Exemplo: ${PREFIX}reverso olá mundo`);
    }

    const reversed = [...text].reverse().join("");
    const isPalindrome =
      text.toLowerCase().replace(/[^a-z0-9]/g, "").length > 2 &&
      text.toLowerCase().replace(/[^a-z0-9]/g, "") === reversed.toLowerCase().replace(/[^a-z0-9]/g, "");

    await sendReply(`🔁 ${reversed}${isPalindrome ? "\n\n✨ É um palíndromo!" : ""}`);
  },
};
