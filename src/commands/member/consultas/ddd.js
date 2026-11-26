import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getDdd, onlyDigits } from "../../../services/brasil-api.js";

export default {
  name: "ddd",
  description: "Mostra o estado e as cidades de um DDD.",
  commands: ["ddd"],
  usage: `${PREFIX}ddd 11`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendWaitReact, sendSuccessReact }) => {
    const ddd = onlyDigits(args[0]);

    if (ddd.length !== 2) {
      throw new InvalidParameterError(`Envie um DDD com 2 números! Exemplo: ${PREFIX}ddd 11`);
    }

    await sendWaitReact();
    const data = await getDdd(ddd);

    const cities = [...(data.cities || [])].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const shown = cities.slice(0, 40).map((city) => city.charAt(0) + city.slice(1).toLowerCase());
    const more = cities.length > 40 ? `\n...e mais ${cities.length - 40} cidades.` : "";

    await sendSuccessReact();
    await sendReply(
      `📞 *DDD ${ddd}* — ${data.state}\n🏙️ ${cities.length} cidades:\n\n${shown.join(", ")}${more}`,
    );
  },
};
