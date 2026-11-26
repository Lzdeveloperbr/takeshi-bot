import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { getActivity } from "../../utils/activity.js";
import { onlyNumbers } from "../../utils/index.js";

const MAX_LISTED = 50;

export default {
  name: "inativos",
  description: "Lista os membros que não mandaram nenhuma mensagem desde o início da contagem.",
  commands: ["inativos", "fantasmas", "inactive"],
  usage: `${PREFIX}inativos`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, getGroupParticipants, sendText, sendReact }) => {
    const participants = await getGroupParticipants();

    if (!participants.length) {
      throw new WarningError("Este comando só funciona em grupos.");
    }

    const { since, members } = getActivity(remoteJid);

    const inactive = participants
      .filter((participant) => !participant.admin)
      .map((participant) => participant.id)
      .filter((id) => !members[id] && !members[id?.replace(/:[0-9]+(?=@)/, "")]);

    const sinceText = new Date(since).toLocaleDateString("pt-BR");

    if (!inactive.length) {
      await sendReact("🎉");
      await sendText(`🎉 Todos os membros mandaram mensagem desde ${sinceText}!`);
      return;
    }

    const listed = inactive.slice(0, MAX_LISTED);
    const more = inactive.length > MAX_LISTED ? `\n...e mais ${inactive.length - MAX_LISTED}.` : "";

    await sendReact("👻");
    await sendText(
      `👻 *INATIVOS (${inactive.length})*\nSem mensagens desde ${sinceText} (admins não entram na lista):\n\n${listed
        .map((id) => `▢ • @${onlyNumbers(id)}`)
        .join("\n")}${more}`,
      listed,
    );
  },
};
