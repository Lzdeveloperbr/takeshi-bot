import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { parseBrDate, startOfToday } from "../../../utils/dates.js";

export default {
  name: "dias-ate",
  description: "Conta quantos dias faltam (ou passaram) até uma data.",
  commands: ["dias-ate", "diasate", "contagem", "quanto-falta"],
  usage: `${PREFIX}dias-ate 25/12  (ou 25/12/2027)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply }) => {
    const [dateText, ...rest] = (fullArgs || "").trim().split(/\s+/);
    const date = parseBrDate(dateText);

    if (!date) {
      throw new InvalidParameterError(`Envie uma data! Exemplo: ${PREFIX}dias-ate 25/12 Natal`);
    }

    const today = startOfToday();
    let target = new Date(date.year ?? today.getFullYear(), date.month - 1, date.day);

    if (date.year === null && target < today) {
      target = new Date(today.getFullYear() + 1, date.month - 1, date.day);
    }

    const days = Math.round((target - today) / 86_400_000);
    const label = rest.join(" ").trim();
    const what = label ? ` para *${label}*` : "";
    const dateLabel = target.toLocaleDateString("pt-BR");

    let text;
    if (days === 0) text = `🎉 É *hoje*${what}! (${dateLabel})`;
    else if (days > 0) text = `⏳ Faltam *${days}* dia(s)${what} (${dateLabel})\n📆 Cerca de ${Math.floor(days / 7)} semana(s) e ${days % 7} dia(s)`;
    else text = `⌛ Já se passaram *${-days}* dia(s) desde ${dateLabel}${label ? ` (${label})` : ""}`;

    await sendReply(text);
  },
};
