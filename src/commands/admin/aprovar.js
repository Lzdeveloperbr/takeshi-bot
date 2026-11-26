import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { isFalse } from "../../utils/index.js";
import { errorLog } from "../../utils/logger.js";

export default {
  name: "aprovar",
  description: "Aprova (ou recusa, com 0) todos os pedidos pendentes para entrar no grupo.",
  commands: ["aprovar", "aprovar-todos", "pedidos"],
  usage: `${PREFIX}aprovar (ou ${PREFIX}aprovar 0 para recusar todos)`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, isGroup, remoteJid, socket, sendSuccessReply, sendWaitReact }) => {
    if (!isGroup) {
      throw new WarningError("Este comando só deve ser usado em grupos!");
    }

    const action = isFalse(args[0]) ? "reject" : "approve";

    await sendWaitReact();

    let requests;
    try {
      requests = await socket.groupRequestParticipantsList(remoteJid);
    } catch (error) {
      errorLog(`Erro ao listar pedidos: ${error.message}`);
      throw new WarningError("Não consegui ver os pedidos. Verifique se eu sou administrador!");
    }

    const jids = (requests || []).map((request) => request.jid).filter(Boolean);

    if (!jids.length) {
      throw new WarningError("Não há pedidos pendentes para entrar no grupo.");
    }

    for (let i = 0; i < jids.length; i += 20) {
      await socket.groupRequestParticipantsUpdate(remoteJid, jids.slice(i, i + 20), action);
    }

    await sendSuccessReply(
      `${jids.length} pedido(s) ${action === "approve" ? "aprovado(s)" : "recusado(s)"}!`,
    );
  },
};
