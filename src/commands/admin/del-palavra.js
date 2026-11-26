import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { removeBannedWord } from "../../utils/database.js";

export default {
  name: "del-palavra",
  description: "Remove palavras da lista de proibidas do grupo.",
  commands: ["del-palavra", "remover-palavra", "liberar-palavra"],
  usage: `${PREFIX}del-palavra palavra1 | palavra2`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, isGroup, args, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const words = args.map((word) => word.trim()).filter(Boolean);

    if (!words.length) {
      throw new InvalidParameterError(`Informe a palavra! Exemplo: ${PREFIX}del-palavra feio`);
    }

    const removed = words.filter((word) => removeBannedWord(remoteJid, word));

    if (!removed.length) {
      throw new WarningError("Nenhuma dessas palavras estava na lista.");
    }

    await sendSuccessReply(`${removed.length} palavra(s) removida(s) da lista.`);
  },
};
