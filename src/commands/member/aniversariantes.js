import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getBirthdays } from "../../utils/database.js";
import { onlyNumbers } from "../../utils/index.js";
import { birthdayInYear, nowInTimezone } from "../../utils/scheduler.js";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Dias até o próximo aniversário (0 = hoje). Considera 29/02 em anos não bissextos. */
export function daysUntil(day, month, now) {
  const year = now.year ?? new Date().getFullYear();
  const today = Date.UTC(year, now.month - 1, now.day);

  const dateIn = (y) => {
    const date = birthdayInYear({ day, month }, y);
    return Date.UTC(y, date.month - 1, date.day);
  };

  let next = dateIn(year);
  if (next < today) next = dateIn(year + 1);

  return Math.round((next - today) / 86_400_000);
}

export default {
  name: "aniversariantes",
  description: "Lista os próximos aniversários do grupo.",
  commands: ["aniversariantes", "proximos-niver", "nivers"],
  usage: `${PREFIX}aniversariantes`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, sendText, sendReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const members = getBirthdays()[remoteJid]?.members || {};
    const now = nowInTimezone();

    const list = Object.entries(members)
      .map(([id, { day, month }]) => ({ id, day, month, days: daysUntil(day, month, now) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 15);

    if (!list.length) {
      throw new WarningError(`Ninguém registrou o aniversário ainda. Use ${PREFIX}niver 25/12`);
    }

    const lines = list.map(
      ({ id, day, month, days }) =>
        `🎂 ${String(day).padStart(2, "0")} ${MONTHS[month - 1]} — @${onlyNumbers(id)} ${days === 0 ? "*HOJE!* 🎉" : `(em ${days} dia${days > 1 ? "s" : ""})`}`,
    );

    await sendReact("🎂");
    await sendText(`🎂 *Próximos aniversários*\n\n${lines.join("\n")}`, list.map(({ id }) => id));
  },
};
