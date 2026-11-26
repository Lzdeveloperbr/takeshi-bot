import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { parseBrDate, startOfToday } from "../../../utils/dates.js";

export default {
  name: "idade",
  description: "Calcula a idade exata e quanto falta para o próximo aniversário.",
  commands: ["idade", "aniversario", "aniversário"],
  usage: `${PREFIX}idade 25/12/2000`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const date = parseBrDate(fullArgs?.trim().split(/\s+/)[0]);
    const today = startOfToday();

    if (!date?.year) {
      throw new InvalidParameterError(`Envie a data de nascimento! Exemplo: ${PREFIX}idade 25/12/2000`);
    }

    const birth = new Date(date.year, date.month - 1, date.day);
    if (birth > today) {
      throw new InvalidParameterError("Essa data ainda não chegou!");
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    let next = new Date(today.getFullYear(), date.month - 1, date.day);
    if (next < today) next = new Date(today.getFullYear() + 1, date.month - 1, date.day);
    const daysToBirthday = Math.round((next - today) / 86_400_000);
    const totalDays = Math.round((today - birth) / 86_400_000);

    await sendReact("🎂");
    await sendReply(
      `🎂 *Idade:* ${years} anos, ${months} meses e ${days} dias\n📆 Já viveu *${totalDays.toLocaleString("pt-BR")}* dias\n${
        daysToBirthday === 0 ? "🎉 *Hoje é aniversário! Parabéns!*" : `⏳ Próximo aniversário em *${daysToBirthday}* dia(s)`
      }`,
    );
  },
};
