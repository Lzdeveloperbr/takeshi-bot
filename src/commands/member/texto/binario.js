import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export function toBinary(text) {
  return [...Buffer.from(text, "utf8")].map((byte) => byte.toString(2).padStart(8, "0")).join(" ");
}

export function fromBinary(binary) {
  const bytes = binary.trim().split(/\s+/).map((chunk) => Number.parseInt(chunk, 2));
  return Buffer.from(bytes).toString("utf8");
}

export default {
  name: "binario",
  description: "Converte texto em binário e vice-versa.",
  commands: ["binario", "binário", "binary"],
  usage: `${PREFIX}binario oi  |  ${PREFIX}binario 01101111 01101001`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, replyText, sendReply }) => {
    const text = (fullArgs?.trim() || replyText?.trim() || "").slice(0, 500);

    if (!text) {
      throw new InvalidParameterError(`Escreva um texto! Exemplo: ${PREFIX}binario oi`);
    }

    const isBinary = /^[01\s]+$/.test(text) && text.replace(/\s/g, "").length % 8 === 0;

    await sendReply(`💻 *${isBinary ? "Texto" : "Binário"}:*\n\n${isBinary ? fromBinary(text) : toBinary(text)}`);
  },
};
