import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { getBank, onlyDigits } from "../../../services/brasil-api.js";

export default {
  name: "banco",
  description: "Consulta um banco pelo código (ex.: 001, 237, 260).",
  commands: ["banco", "bank"],
  usage: `${PREFIX}banco 260`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendReply, sendWaitReact, sendSuccessReact }) => {
    const code = onlyDigits(args[0]);

    if (!code || code.length > 3) {
      throw new InvalidParameterError(`Envie o código do banco! Exemplo: ${PREFIX}banco 260`);
    }

    await sendWaitReact();
    const data = await getBank(code);

    await sendSuccessReact();
    await sendReply(
      `🏦 *${data.name || data.fullName}*\n\n🔢 Código: ${String(data.code).padStart(3, "0")}\n📝 Nome completo: ${data.fullName || "-"}\n🆔 ISPB: ${data.ispb || "-"}`,
    );
  },
};
