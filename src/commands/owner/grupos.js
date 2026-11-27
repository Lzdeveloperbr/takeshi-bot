import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { isActiveGroup } from "../../utils/database.js";

export default {
  name: "grupos",
  description: "Lista os grupos em que o bot está (nome, membros, ID e se está ativo).",
  commands: ["grupos", "meus-grupos", "list-groups"],
  usage: `${PREFIX}grupos`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, sendReply, sendWaitReact }) => {
    await sendWaitReact();

    const groups = Object.values(await socket.groupFetchAllParticipating());

    if (!groups.length) {
      throw new WarningError("O bot não está em nenhum grupo.");
    }

    groups.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));

    const lines = groups.map(
      (group, i) =>
        `${i + 1}. *${group.subject}*\n   👥 ${group.participants?.length || 0} | ${isActiveGroup(group.id) ? "✅ ativo" : "⏸️ desligado"}\n   🆔 ${group.id}`,
    );

    await sendReply(`📋 *Grupos do bot (${groups.length})*\n\n${lines.join("\n\n")}`);
  },
};
