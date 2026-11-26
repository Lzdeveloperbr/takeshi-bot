import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "set-desc",
  description: "Muda a descrição do grupo (ou use a mensagem respondida).",
  commands: ["set-desc", "descricao", "descrição", "mudar-descricao"],
  usage: `${PREFIX}set-desc nova descrição`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullMessage, replyText, remoteJid, isGroup, socket, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    // Mantém as quebras de linha do texto digitado.
    const description = fullMessage?.replace(/^\S+\s?/, "").trim() || replyText?.trim();

    if (!description) {
      throw new InvalidParameterError(`Escreva a nova descrição! Exemplo: ${PREFIX}set-desc Grupo de amigos 🎉`);
    }

    if (description.length > 2048) {
      throw new InvalidParameterError("A descrição pode ter no máximo 2048 caracteres.");
    }

    try {
      await socket.groupUpdateDescription(remoteJid, description);
    } catch (error) {
      errorLog(`Erro ao mudar descrição: ${error.message}`);
      throw new WarningError("Não consegui mudar a descrição. Verifique se eu sou administrador!");
    }

    await sendSuccessReply("Descrição do grupo atualizada!");
  },
};
