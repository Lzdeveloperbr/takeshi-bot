import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getHolidays } from "../../../services/brasil-api.js";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default {
  name: "feriados",
  description: "Lista os feriados nacionais do ano (e quanto falta para o próximo).",
  commands: ["feriados", "feriado", "holidays"],
  usage: `${PREFIX}feriados 2027`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendWaitReact, sendSuccessReact }) => {
    const currentYear = new Date().getFullYear();
    const year = args[0] ? Number.parseInt(args[0], 10) : currentYear;

    if (!Number.isInteger(year) || year < 1900 || year > 2199) {
      throw new InvalidParameterError(`Envie um ano válido! Exemplo: ${PREFIX}feriados ${currentYear}`);
    }

    await sendWaitReact();
    const holidays = await getHolidays(year);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let next = null;
    const lines = holidays.map((holiday) => {
      const [y, m, d] = holiday.date.split("-").map(Number);
      const date = new Date(y, m - 1, d);

      if (!next && date >= today) next = { ...holiday, date };

      const past = date < today ? "~" : "";
      return `${past}▢ ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} (${WEEKDAYS[date.getDay()]}) — ${holiday.name}${past}`;
    });

    let nextText = "";
    if (next) {
      const days = Math.round((next.date - today) / 86_400_000);
      nextText = `\n\n⏳ Próximo: *${next.name}* ${days === 0 ? "é *hoje*! 🎉" : `em *${days}* dia(s)`}`;
    }

    await sendSuccessReact();
    await sendReply(`📅 *Feriados nacionais de ${year}*\n\n${lines.join("\n")}${nextText}`);
  },
};
