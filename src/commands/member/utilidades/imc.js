import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";

const RANGES = [
  [18.5, "Abaixo do peso", "🔵"],
  [25, "Peso normal", "🟢"],
  [30, "Sobrepeso", "🟡"],
  [35, "Obesidade grau I", "🟠"],
  [40, "Obesidade grau II", "🔴"],
  [Infinity, "Obesidade grau III", "🟣"],
];

export function calculateImc(weightKg, heightM) {
  const imc = weightKg / heightM ** 2;
  const [, label, emoji] = RANGES.find(([max]) => imc < max);
  return { imc, label, emoji };
}

export default {
  name: "imc",
  description: "Calcula o IMC (índice de massa corporal).",
  commands: ["imc"],
  usage: `${PREFIX}imc 70 1,75  (peso em kg e altura em metros)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendReply }) => {
    const [weight, rawHeight] = (fullArgs.replace(/,/g, ".").match(/\d+(\.\d+)?/g) || []).map(Number);
    const height = rawHeight > 3 ? rawHeight / 100 : rawHeight;

    if (!weight || !height || weight < 2 || weight > 500 || height < 0.4 || height > 2.6) {
      throw new InvalidParameterError(`Use: ${PREFIX}imc peso altura\nExemplo: ${PREFIX}imc 70 1,75 (ou ${PREFIX}imc 70 175)`);
    }

    const { imc, label, emoji } = calculateImc(weight, height);
    const minIdeal = 18.5 * height ** 2;
    const maxIdeal = 24.9 * height ** 2;

    await sendReply(
      `⚖️ *IMC:* ${imc.toFixed(1)}\n${emoji} ${label}\n\n📏 Peso ideal para ${height.toFixed(2)} m: ${minIdeal.toFixed(1)} a ${maxIdeal.toFixed(1)} kg\n\n_O IMC é só uma referência; consulte um profissional de saúde._`,
    );
  },
};
