import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { removeGroupRules, setGroupRules } from "../../utils/database.js";

export default {
  name: "set-regras",
  description: "Define (ou apaga) as regras do grupo, exibidas com o comando regras.",
  commands: ["set-regras", "definir-regras", "set-rules"],
  usage: `${PREFIX}set-regras <texto das regras> (ou responda a uma mensagem) | ${PREFIX}set-regras apagar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, fullMessage, fullArgs, replyText, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    if (["apagar", "remover", "limpar"].includes(fullArgs?.trim().toLowerCase())) {
      if (!removeGroupRules(remoteJid)) {
        throw new WarningError("Este grupo não tinha regras definidas.");
      }

      await sendSuccessReply("Regras do grupo apagadas!");
      return;
    }

    // Mantém as quebras de linha do texto original (fullArgs junta tudo).
    const fromMessage = fullMessage?.replace(/^\S+\s?/, "").trim();
    const rules = fromMessage || replyText?.trim();

    if (!rules) {
      throw new InvalidParameterError(
        `Escreva as regras depois do comando ou responda a uma mensagem com ${PREFIX}set-regras`,
      );
    }

    if (rules.length > 3000) {
      throw new InvalidParameterError("As regras devem ter no máximo 3000 caracteres.");
    }

    setGroupRules(remoteJid, rules);

    await sendSuccessReply(`Regras salvas! Os membros podem ver com ${PREFIX}regras`);
  },
};
