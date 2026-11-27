import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { getBirthdays, setBirthday } from "../../utils/database.js";
import { parseBrDate } from "../../utils/dates.js";

export default {
  name: "niver",
  description: "Registra seu aniversário: o bot te parabeniza no grupo no dia!",
  commands: ["niver", "meu-aniversario", "meu-niver", "registrar-niver"],
  usage: `${PREFIX}niver 25/12  |  ${PREFIX}niver remover`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, isGroup, remoteJid, userLid, sendReply, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Registre seu aniversário dentro do grupo.");
    }

    const input = (fullArgs || "").trim().toLowerCase();
    const current = getBirthdays()[remoteJid]?.members?.[userLid];

    if (!input) {
      await sendReply(
        current
          ? `🎂 Seu aniversário está registrado: *${String(current.day).padStart(2, "0")}/${String(current.month).padStart(2, "0")}*`
          : `🎂 Registre seu aniversário! Exemplo: ${PREFIX}niver 25/12`,
      );
      return;
    }

    if (["remover", "apagar", "off"].includes(input)) {
      setBirthday(remoteJid, userLid, null);
      await sendSuccessReply("Aniversário removido.");
      return;
    }

    const date = parseBrDate(input.split(/\s+/)[0]);

    if (!date) {
      throw new InvalidParameterError(`Envie o dia e o mês! Exemplo: ${PREFIX}niver 25/12`);
    }

    setBirthday(remoteJid, userLid, date);

    await sendSuccessReply(
      `Aniversário registrado: *${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}* 🎂\nNo dia, vou te parabenizar aqui no grupo!`,
    );
  },
};
