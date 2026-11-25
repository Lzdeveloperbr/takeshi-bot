import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const CHARSETS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%&*?-_+=",
];

export default {
  name: "senha",
  description: "Gera uma senha forte e aleatória (8 a 64 caracteres).",
  commands: ["senha", "gerar-senha", "password"],
  usage: `${PREFIX}senha 16`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendReact }) => {
    const length = args[0] ? Number.parseInt(args[0], 10) : 16;

    if (!Number.isInteger(length) || length < 8 || length > 64) {
      throw new InvalidParameterError("O tamanho da senha deve ser entre 8 e 64.");
    }

    // Garante ao menos um caractere de cada tipo.
    const chars = CHARSETS.map((set) => set[randomInt(set.length)]);
    const all = CHARSETS.join("");
    while (chars.length < length) chars.push(all[randomInt(all.length)]);

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    await sendReact("🔐");
    await sendReply(
      `🔐 *Senha gerada (${length} caracteres):*\n\n\`\`\`${chars.join("")}\`\`\`\n\n_Dica: gere no privado do bot para ninguém ver._`,
    );
  },
};
