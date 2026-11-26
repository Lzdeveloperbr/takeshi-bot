import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getBannedWords, isActiveGroupRestriction } from "../../utils/database.js";

export default {
  name: "palavras",
  description: "Mostra a lista de palavras proibidas do grupo.",
  commands: ["palavras", "palavras-proibidas", "list-palavras"],
  usage: `${PREFIX}palavras`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, isGroup, sendReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const words = getBannedWords(remoteJid);

    if (!words.length) {
      throw new WarningError(`Nenhuma palavra proibida. Adicione com ${PREFIX}add-palavra`);
    }

    const status = isActiveGroupRestriction(remoteJid, "anti-palavra") ? "✅ ligado" : "❌ desligado";

    await sendReply(
      `🚫 *Palavras proibidas (${words.length})*\nAnti-palavra: ${status}\n\n${words.map((word) => `▢ ${word}`).join("\n")}`,
    );
  },
};
