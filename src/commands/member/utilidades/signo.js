import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { parseBrDate } from "../../../utils/dates.js";

// [mês, dia de início, nome, emoji, elemento]
const SIGNS = [
  [1, 20, "Aquário", "♒", "Ar"],
  [2, 19, "Peixes", "♓", "Água"],
  [3, 21, "Áries", "♈", "Fogo"],
  [4, 20, "Touro", "♉", "Terra"],
  [5, 21, "Gêmeos", "♊", "Ar"],
  [6, 21, "Câncer", "♋", "Água"],
  [7, 23, "Leão", "♌", "Fogo"],
  [8, 23, "Virgem", "♍", "Terra"],
  [9, 23, "Libra", "♎", "Ar"],
  [10, 23, "Escorpião", "♏", "Água"],
  [11, 22, "Sagitário", "♐", "Fogo"],
  [12, 22, "Capricórnio", "♑", "Terra"],
];

export function findSign(day, month) {
  let sign = SIGNS[SIGNS.length - 1];
  for (const entry of SIGNS) {
    if (month > entry[0] || (month === entry[0] && day >= entry[1])) sign = entry;
  }
  return month === 1 && day < 20 ? SIGNS[11] : sign;
}

export default {
  name: "signo",
  description: "Descobre o signo pela data de nascimento.",
  commands: ["signo", "zodiaco", "zodíaco"],
  usage: `${PREFIX}signo 25/12`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply, sendReact }) => {
    const date = parseBrDate(fullArgs?.trim().split(/\s+/)[0]);

    if (!date) {
      throw new InvalidParameterError(`Envie o dia e o mês! Exemplo: ${PREFIX}signo 25/12`);
    }

    const [, , name, emoji, element] = findSign(date.day, date.month);

    await sendReact(emoji);
    await sendReply(`${emoji} Quem nasceu em ${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")} é de *${name}*\n🌐 Elemento: ${element}`);
  },
};
