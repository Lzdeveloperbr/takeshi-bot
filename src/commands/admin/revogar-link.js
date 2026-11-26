import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "revogar-link",
  description: "Cria um novo link do grupo (o link antigo para de funcionar).",
  commands: ["revogar-link", "resetar-link", "novo-link", "redefinir-link"],
  usage: `${PREFIX}revogar-link`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ isGroup, remoteJid, socket, sendSuccessReply }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    let code;
    try {
      code = await socket.groupRevokeInvite(remoteJid);
    } catch (error) {
      errorLog(`Erro ao revogar link: ${error.message}`);
      throw new WarningError("Não consegui gerar um novo link. Verifique se eu sou administrador!");
    }

    await sendSuccessReply(`Link antigo desativado!\n\n🔗 Novo link: https://chat.whatsapp.com/${code}`);
  },
};
