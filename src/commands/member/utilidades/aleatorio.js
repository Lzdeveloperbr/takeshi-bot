import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export default {
  name: "aleatorio",
  description: "Sorteia um número aleatório entre dois valores.",
  commands: ["aleatorio", "aleatório", "numero", "random"],
  usage: `${PREFIX}aleatorio 1 100`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const numbers = (fullArgs.match(/-?\d+/g) || []).map(Number);
    const [min, max] = numbers.length >= 2 ? [Math.min(...numbers.slice(0, 2)), Math.max(...numbers.slice(0, 2))] : [1, numbers[0] || 100];

    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max - min > 1_000_000_000_000 || max < min) {
      throw new InvalidParameterError(`Use dois números! Exemplo: ${PREFIX}aleatorio 1 100`);
    }

    await sendReact("🎲");
    await sendReply(`🎲 Entre *${min}* e *${max}* saiu: *${randomInt(min, max + 1)}*`);
  },
};
