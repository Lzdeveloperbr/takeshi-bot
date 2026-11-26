import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import {
  addBannedWord,
  getBannedWords,
  isActiveGroupRestriction,
} from "../../utils/database.js";

export default {
  name: "add-palavra",
  description: "Adiciona palavras proibidas no grupo (separe várias com |).",
  commands: ["add-palavra", "proibir-palavra", "add-palavrao"],
  usage: `${PREFIX}add-palavra palavra1 | palavra2`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, isGroup, args, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const words = args.map((word) => word.trim()).filter(Boolean);

    if (!words.length) {
      throw new InvalidParameterError(`Informe a palavra! Exemplo: ${PREFIX}add-palavra feio | chato`);
    }

    if (words.some((word) => word.length > 50)) {
      throw new InvalidParameterError("Cada palavra pode ter no máximo 50 caracteres.");
    }

    if (getBannedWords(remoteJid).length + words.length > 200) {
      throw new WarningError("O limite é de 200 palavras por grupo.");
    }

    const added = words.filter((word) => addBannedWord(remoteJid, word));
    const active = isActiveGroupRestriction(remoteJid, "anti-palavra");

    await sendSuccessReply(
      `${added.length} palavra(s) adicionada(s).${
        active ? "" : `\n\n⚠️ O anti-palavra está desligado. Ative com ${PREFIX}anti-palavra 1`
      }`,
    );
  },
};
