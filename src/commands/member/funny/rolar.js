import { randomInt } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

export function parseDice(text) {
  const match = /^(\d{0,3})d(\d{1,4})([+-]\d{1,4})?$/i.exec(String(text || "d20").replace(/\s/g, ""));
  if (!match) return null;

  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);

  if (count < 1 || count > 50 || sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

export default {
  name: "rolar",
  description: "Rola dados de RPG (ex.: d20, 2d6+3).",
  commands: ["rolar", "roll", "rpg"],
  usage: `${PREFIX}rolar 2d6+3`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const dice = parseDice(fullArgs?.trim() || "d20");

    if (!dice) {
      throw new InvalidParameterError(`Use o formato de RPG! Exemplos: ${PREFIX}rolar d20, ${PREFIX}rolar 2d6+3 (até 50 dados de 1000 lados)`);
    }

    const rolls = Array.from({ length: dice.count }, () => randomInt(1, dice.sides + 1));
    const total = rolls.reduce((a, b) => a + b, 0) + dice.modifier;
    const mod = dice.modifier ? ` ${dice.modifier > 0 ? "+" : "-"} ${Math.abs(dice.modifier)}` : "";
    const critical =
      dice.count === 1 && dice.sides === 20 ? (rolls[0] === 20 ? "\n\n💥 *CRÍTICO!*" : rolls[0] === 1 ? "\n\n💀 *Falha crítica!*" : "") : "";

    await sendReact("🎲");
    await sendReply(
      `🎲 *${dice.count}d${dice.sides}${mod}*\n\nDados: [${rolls.join(", ")}]${mod}\nTotal: *${total}*${critical}`,
    );
  },
};
